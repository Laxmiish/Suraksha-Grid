from pydantic import BaseModel
from typing import Optional

class AddressDetails(BaseModel):
    care_of: Optional[str] = None
    house: Optional[str] = None
    street: Optional[str] = None
    locality: Optional[str] = None
    vtc: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None

class EKycResponse(BaseModel):
    reference_id: str
    name: str
    dob: str
    gender: str
    address: AddressDetails
    photo_base64: Optional[str] = None

class RegisterRequest(BaseModel):
    reference_id: str
    name: str
    dob: str
    gender: str
    state: str
    mobile: str
    email: str
    password: str
    role: str  # 'worker' or 'contractor'

class LoginRequest(BaseModel):
    mobile: str
    password: str
    role: str

class AddJobSite(BaseModel):
    contractor_id: str
    name: str
    state: str
    start: str
    end: str

class AddWorker(BaseModel):
    jobsite_id: int
    worker_reference_id: str
    daily_wage: int

class MarkAbsent(BaseModel):
    jobsite_id: int
    worker_reference_id: str
    date: str