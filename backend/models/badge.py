from pydantic import BaseModel
from typing import List


class Badge(BaseModel):
    id: str
    name: str
    icon: str
    description: str
    earned: bool


class BadgeListResponse(BaseModel):
    address: str
    badges: List[Badge]


