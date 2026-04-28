from datetime import datetime
from pydantic import BaseModel, Field


class LessonCreate(BaseModel):
    no: int = Field(..., ge=1, description="课序号")


class LessonUpdate(BaseModel):
    no: int | None = Field(None, ge=1)


class LessonOut(BaseModel):
    id: int
    volume_id: int
    no: int
    created_at: datetime
    char_count: int = 0

    class Config:
        from_attributes = True
