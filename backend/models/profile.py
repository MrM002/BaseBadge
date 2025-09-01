from pydantic import BaseModel, Field
from typing import Optional


class UserProfile(BaseModel):
    address: str = Field(..., description="User wallet address (0x...)")
    username: Optional[str] = Field(default="", description="Display username")
    name: Optional[str] = Field(default="", description="Full name")
    birthDate: Optional[str] = Field(default="", description="ISO date string")
    avatar: Optional[str] = Field(default="/default-avatar.svg", description="Avatar URL or data URI")
    useBasenameProfile: bool = Field(default=False, description="Whether to sync from Basename profile")
    basename: Optional[str] = Field(default=None, description="Resolved Basename (read-only unless provided)")
    basenameAvatar: Optional[str] = Field(default=None, description="Avatar resolved from Basename (optional)")


