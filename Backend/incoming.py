import logging, jwt, httpx, zipfile, io
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta, timezone
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from passlib.context import CryptContext
import basemodels

origins = ["http://localhost:3000", "http://localhost:5173"]
secret_key = 'heK4w-rrU72qIuGNMerPm762yPayLkvRisjsU-R9ZTs'

app = FastAPI()
app.add_middleware(
    CORSMiddleware, allow_origins=origins, allow_credentials=True,
    allow_methods=["*"], allow_headers=["*"],
)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
logging.basicConfig(level=logging.INFO)

# --- Helper Functions ---
def get_password_hash(password):
    return pwd_context.hash(password)

async def go_microservice_request(method: str, endpoint: str, data: dict = None):
    url = "http://localhost:8080" + endpoint
    async with httpx.AsyncClient() as client:
        if method == "POST":
            response = await client.post(url, json=data)
        elif method == "GET":
            response = await client.get(url)
            
        if response.status_code >= 400:
            raise HTTPException(status_code=response.status_code, detail=response.json())
        return response.json()

# --- ACTUAL OFFLINE E-KYC PARSER ---
@app.post("/api/ekyc/upload", response_model=basemodels.EKycResponse)
async def process_ekyc_zip(file: UploadFile = File(...), share_code: str = Form(...)):
    """
    Takes the ZIP file and the Share Code from the frontend, decrypts it, 
    and parses the XML nodes to return verified Aadhaar details.
    """
    if not file.filename.endswith('.zip'):
        raise HTTPException(status_code=400, detail="Must be a ZIP file")

    try:
        file_bytes = await file.read()
        zip_file = zipfile.ZipFile(io.BytesIO(file_bytes))
        password_bytes = share_code.encode('utf-8')
        
        # Aadhaar Offline e-KYC usually has one XML file inside
        xml_filename = zip_file.namelist()[0]
        
        with zip_file.open(xml_filename, pwd=password_bytes) as xml_file:
            xml_content = xml_file.read()
            
        # Parse XML
        root = ET.fromstring(xml_content)
        
        uid_data = None
        for child in root:
            if child.tag.endswith('UidData'):
                uid_data = child
                break
                
        if uid_data is None:
            raise ValueError("Invalid XML Structure: UidData missing")

        poi = uid_data.find('.//*[local-name()="Poi"]')
        poa = uid_data.find('.//*[local-name()="Poa"]')
        pht = uid_data.find('.//*[local-name()="Pht"]')

        # Map the Address
        address = basemodels.AddressDetails(
            care_of=poa.attrib.get('co'), house=poa.attrib.get('house'),
            street=poa.attrib.get('street'), locality=poa.attrib.get('loc'),
            vtc=poa.attrib.get('vtc'), district=poa.attrib.get('dist'),
            state=poa.attrib.get('state'), pincode=poa.attrib.get('pc')
        )

        # Return the verified data to React so the user can see it before registering
        return basemodels.EKycResponse(
            reference_id=root.attrib.get('referenceId', ''),
            name=poi.attrib.get('name', ''),
            dob=poi.attrib.get('dob', ''),
            gender=poi.attrib.get('gender', ''),
            address=address,
            photo_base64=pht.text if pht is not None else None
        )

    except RuntimeError as e:
        if 'Bad password' in str(e):
            raise HTTPException(status_code=401, detail="Invalid share code")
        raise HTTPException(status_code=400, detail="Failed to open ZIP file")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/register")
async def register(user_data: basemodels.RegisterRequest):
    hashed_pwd = get_password_hash(user_data.password)
    payload = user_data.model_dump()
    payload['password'] = hashed_pwd 
    
    result = await go_microservice_request("POST", "/register", payload)
    return {"success": True, "message": "Registration successful", "data": result}

@app.post("/api/login")
async def login(credentials: basemodels.LoginRequest):
    try:
        go_response = await go_microservice_request("POST", "/login", credentials.model_dump())
        stored_hash = go_response.get("password_hash")
        
        if not pwd_context.verify(credentials.password, stored_hash):
            return {"success": False, "message": "Invalid Password"}
            
        if go_response["role"] != credentials.role:
            return {"success": False, "message": f"User is not registered as a {credentials.role}"}
            
        expire = datetime.now(timezone.utc) + timedelta(hours=24)
        token = jwt.encode({"ref": go_response["reference_id"], "role": go_response["role"], "exp": expire}, secret_key, algorithm='HS256')
        
        return {
            "success": True, "token": token, 
            "reference_id": go_response["reference_id"], "name": go_response["name"]
        }
    except HTTPException:
        return {"success": False, "message": "User not found or Server Error"}

@app.get("/api/worker/benefits/{reference_id}")
async def get_worker_benefits(reference_id: str):
    return await go_microservice_request("GET", f"/worker/benefits/{reference_id}")