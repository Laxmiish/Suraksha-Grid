import logging,jwt,time
from fastapi import FastAPI, Response, UploadFile , Form, Request , File, HTTPException
import zipfile
import io
import xml.etree.ElementTree as ET
from typing import ClassVar,Optional
import redis , queue , httpx , aiofiles , uuid , os , json , datetime
from fastapi.middleware.cors import CORSMiddleware
from jwt.exceptions import ExpiredSignatureError, InvalidTokenError
import basemodels
from lxml import etree
from signxml import XMLVerifier
from signxml.exceptions import InvalidSignature

origins = [
    "http://localhost:3000",  # Vite
    "http://localhost:5173",  # CRA
]

global secret_key 
secret_key='heK4w-rrU72qIuGNMerPm762yPayLkvRisjsU-R9ZTs'

def verify_aadhaar_signature(xml_bytes: bytes, cert_path: str = "uidai_offline_publickey.cer") -> bool:
    """
    Verifies the XML digital signature of the Aadhaar e-KYC data.
    """
    try:
        # 1. Load the UIDAI public certificate
        with open(cert_path, "rb") as cert_file:
            cert_data = cert_file.read()

        # 2. Parse the XML using lxml (required by signxml)
        root = etree.fromstring(xml_bytes)

        # 3. Verify the signature
        # XMLVerifier checks the hash of the data against the encrypted hash in the <Signature> tag
        XMLVerifier().verify(root, x509_cert=cert_data)
        
        # If no exception is raised, the signature is valid!
        return True

    except InvalidSignature as e:
        print(f"Signature validation failed: {e}")
        return False
    except Exception as e:
        print(f"An error occurred during verification: {e}")
        return False

def parse_ekyc_xml(xml_bytes: bytes) -> basemodels.EKycResponse:
    try:
        root = ET.fromstring(xml_bytes)
        
        # Note: XML namespaces are usually present in Aadhaar XML. 
        # For simplicity, we are searching by local tag names.
        # Structure: <OfflinePaperlessKyc referenceId="..."> -> <UidData> -> <Poi>, <Poa>, <Pht>
        
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

        # Map Address
        address = basemodels.AddressDetails(
            care_of=poa.attrib.get('co'),
            house=poa.attrib.get('house'),
            street=poa.attrib.get('street'),
            locality=poa.attrib.get('loc'),
            vtc=poa.attrib.get('vtc'),
            district=poa.attrib.get('dist'),
            state=poa.attrib.get('state'),
            pincode=poa.attrib.get('pc')
        )

        # Create Response
        return basemodels.EKycResponse(
            reference_id=root.attrib.get('referenceId', ''),
            name=poi.attrib.get('name', ''),
            dob=poi.attrib.get('dob', ''),
            gender=poi.attrib.get('gender', ''),
            address=address,
            photo_base64=pht.text if pht is not None else None
        )

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse XML: {str(e)}")
verhoeff_table_d = (
    (0,1,2,3,4,5,6,7,8,9), (1,2,3,4,0,6,7,8,9,5), (2,3,4,0,1,7,8,9,5,6),
    (3,4,0,1,2,8,9,5,6,7), (4,0,1,2,3,9,5,6,7,8), (5,9,8,7,6,0,4,3,2,1),
    (6,5,9,8,7,1,0,4,3,2), (7,6,5,9,8,2,1,0,4,3), (8,7,6,5,9,3,2,1,0,4),
    (9,8,7,6,5,4,3,2,1,0)
)
verhoeff_table_p = (
    (0,1,2,3,4,5,6,7,8,9), (1,5,7,6,2,8,3,0,9,4), (5,8,0,3,7,9,6,1,4,2),
    (8,9,1,6,0,4,3,5,2,7), (9,4,5,3,1,2,6,8,7,0), (4,2,8,6,5,7,3,9,0,1),
    (2,7,9,3,8,0,6,4,1,5), (7,0,4,6,9,1,3,2,5,8)
)

def is_valid_aadhaar(aadhaar_number: str) -> bool:
    """Checks if the 12-digit number follows the Aadhaar mathematical format."""
    # Step 1: Must be exactly 12 digits and only numbers
    if len(aadhaar_number) != 12 or not aadhaar_number.isdigit():
        return False
    
    # Step 2: Cannot start with 0 or 1
    if aadhaar_number[0] in ['0', '1']:
        return False
        
    # Step 3: Run the Verhoeff check
    c = 0
    reversed_aadhaar = aadhaar_number[::-1]
    
    for i, digit in enumerate(reversed_aadhaar):
        c = verhoeff_table_d[c][verhoeff_table_p[i % 8][int(digit)]]
        
    return c == 0

async def tokengenrator(adhar,name,atype):
    now = datetime.datetime.now(datetime.timezone.utc)
    payload={
        "adhar":adhar,
        "name":name,
        "atype":atype
    }
    token = jwt.encode(payload, secret_key, algorithm='HS256')
    return token

async def tokenedid(token):
    try:
        payload = jwt.decode(token, secret_key, algorithm="HS256")
        print("Decoded Payload:", payload)
        return payload
    except ExpiredSignatureError:
        print("Token expired — ask user to reauthenticate.")
    except InvalidTokenError:
        print("Invalid token — possible tampering or wrong key.")

async def worker_post(data,ty):
     url = "http://localhost:8080/"+ty
     async with httpx.AsyncClient() as client:
         response = await client.post(url,json=data)
     return response.json()

async def worker_get(data,ty):
     url = "http://localhost:8080/"+ty
     async with httpx.AsyncClient() as client:
         response = await client.get(url,json=data)
     return response.json()

app=FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # or ["*"] for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    # Log incoming request
    request_body = await request.body()
    logger.info(f"Incoming request: {request.method} {request.url}")
    logger.info(f"Headers: {dict(request.headers)}")
    if request_body:
        try:
            logger.info(f"Request body: {request_body.decode()}")
        except UnicodeDecodeError:
            logger.info(f"Request body (binary): {request_body}")

    # Process request
    start_time = time.time()
    response: Response = await call_next(request)
    process_time = time.time() - start_time

    # Read response body safely
    response_body = b""
    async for chunk in response.body_iterator:
        response_body += chunk

    try:
        body_text = response_body.decode()
    except UnicodeDecodeError:
        body_text = "<binary data>"

    # Log outgoing response
    logger.info(f"Response status: {response.status_code}")
    logger.info(f"Response body: {body_text}")
    logger.info(f"Process time: {process_time:.4f}s")

    # Rebuild response
    return Response(
        content=response_body,
        status_code=response.status_code,
        headers=dict(response.headers),
        media_type=response.media_type
    )

@app.post("/registration/e-kyc",response_model=basemodels.EKycResponse)
async def verify(
    file: UploadFile = File(...),
    share_code: str = Form(...) 
):
    if not file.filename.endswith('.zip'):
        raise HTTPException(status_code=400, detail="Must be a ZIP file")

    try:
        file_bytes = await file.read()
        zip_file = zipfile.ZipFile(io.BytesIO(file_bytes))
        password_bytes = share_code.encode('utf-8')
        
        xml_filename = zip_file.namelist()[0]
        
        with zip_file.open(xml_filename, pwd=password_bytes) as xml_file:
            xml_content = xml_file.read()
         
        #skipping securtity test during development
        """# SECURITY CHECK: Validate Signature First
        is_valid = verify_aadhaar_signature(xml_content)
        if not is_valid:
            raise HTTPException(
                status_code=403, 
                detail="Digital signature validation failed. Data may be tampered with."
            )"""
            
        # If valid, proceed to parse the data
        response= parse_ekyc_xml(xml_content)
        newuser=
    except RuntimeError as e:
        if 'Bad password' in str(e):
            raise HTTPException(status_code=401, detail="Invalid share code/password")
        raise HTTPException(status_code=400, detail="Failed to process ZIP file")
    except HTTPException:
        raise # Re-raise HTTP exceptions to maintain status codes
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/registration/data")
async def data()

@app.get("/login")
def login()

@app.post

@app.get("/contractor/attendance")

@app.post("/contractor/change-attendace")

@app.post("/contractor/add-project")

@app.post("/contractor/add-labour")

