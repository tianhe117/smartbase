from datetime import datetime
from pydantic import BaseModel, Field


class VolumeCreate(BaseModel):
    no: int = Field(..., ge=1, description="册序号")
    name: str = Field(..., min_length=1, max_length=100, description="册名称")


class VolumeUpdate(BaseModel):
    no: int | None = Field(None, ge=1)
    name: str | None = Field(None, min_length=1, max_length=100)


class VolumeOut(BaseModel):
    id: int
    no: int
    name: str
    sort_order: int
    created_at: datetime
    lesson_count: int = 0
    char_count: int = 0

    class Config:
        from_attributes = True
