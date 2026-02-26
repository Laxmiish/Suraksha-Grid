from pydantic import BaseModel
from typing import ClassVar,Optional

class registration(BaseModel):
    id:str

class AddressDetails(BaseModel):
    care_of: Optional[str] = None
    house: Optional[str] = None
    street: Optional[str] = None
    locality: Optional[str] = None
    vtc: Optional[str] = None # Village/Town/City
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

class registerdetail(BaseModel):
    phone:str
    email:str
    password:str


class login1(BaseModel):
    id:str
    password:str