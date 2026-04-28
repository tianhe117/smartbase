from fastapi import APIRouter
from pydantic import BaseModel, Field

from ..services.char_lookup import lookup_character

router = APIRouter(prefix="/api/v1/lookup", tags=["lookup"])


class LookupIn(BaseModel):
    char: str = Field(..., min_length=1, max_length=1, description="单个汉字")


class LookupOut(BaseModel):
    char: str
    pinyin: str
    word_1: str
    word_2: str


@router.post("/character", response_model=LookupOut)
async def lookup_char(data: LookupIn):
    """Look up pinyin and common words for a Chinese character."""
    result = await lookup_character(data.char)
    return result
