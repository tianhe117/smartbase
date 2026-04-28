from datetime import datetime
from pydantic import BaseModel, Field


class ReviewResultIn(BaseModel):
    character_id: int = Field(..., description="汉字ID")
    known: bool = Field(..., description="是否认识")


class ReviewCharOut(BaseModel):
    id: int
    char: str
    pinyin: str
    word_1: str
    word_2: str | None
    word_3: str | None
    lesson_no: int
    weight: float = 0.0

    class Config:
        from_attributes = True


class ReviewStatsOut(BaseModel):
    total_chars: int = 0
    mastered: int = 0         # known_count >= 5
    learning: int = 0         # 0 < known_count < 5
    unfamiliar: int = 0       # unknown_count > 0 且 known_count < 3
    new_chars: int = 0        # 从未练习
