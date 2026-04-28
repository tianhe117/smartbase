from datetime import datetime
from pydantic import BaseModel, Field


class CharacterCreate(BaseModel):
    char: str = Field(..., min_length=1, max_length=1, description="汉字")
    pinyin: str = Field(..., min_length=1, max_length=20, description="拼音")
    word_1: str = Field(..., min_length=1, max_length=50, description="组词1")
    word_2: str | None = Field(None, max_length=50, description="组词2")
    word_3: str | None = Field(None, max_length=50, description="组词3")
    char_type: str = Field("new", pattern="^(new|mistake|mastered)$", description="类型: new/mistake/mastered")


class CharacterUpdate(BaseModel):
    char: str | None = Field(None, min_length=1, max_length=1)
    pinyin: str | None = Field(None, min_length=1, max_length=20)
    word_1: str | None = Field(None, min_length=1, max_length=50)
    word_2: str | None = Field(None, max_length=50)
    word_3: str | None = Field(None, max_length=50)
    char_type: str | None = Field(None, pattern="^(new|mistake|mastered)$")


class CharacterOut(BaseModel):
    id: int
    lesson_id: int
    char: str
    pinyin: str
    word_1: str
    word_2: str | None
    word_3: str | None
    char_type: str
    created_at: datetime

    class Config:
        from_attributes = True


class CharacterWithProgress(CharacterOut):
    known_count: int = 0
    unknown_count: int = 0
    last_seen: datetime | None = None
