import asyncio
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.lesson import Lesson
from ..models.character import Character
from ..schemas.character import CharacterCreate, CharacterUpdate, CharacterOut
from ..services.char_lookup import lookup_character

router = APIRouter(prefix="/api/v1", tags=["characters"])


@router.get("/lessons/{lesson_id}/characters", response_model=list[CharacterOut])
def list_characters(lesson_id: int, db: Session = Depends(get_db)):
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="课不存在")
    chars = db.query(Character).filter(Character.lesson_id == lesson_id).order_by(Character.id).all()
    return chars


@router.get("/characters/all", response_model=list[CharacterOut])
def list_all_characters(volume_id: int | None = None, db: Session = Depends(get_db)):
    """Get all characters, optionally filtered by volume."""
    query = db.query(Character).join(Lesson, Character.lesson_id == Lesson.id)
    if volume_id is not None:
        query = query.filter(Lesson.volume_id == volume_id)
    return query.order_by(Lesson.volume_id, Lesson.no, Character.id).all()


@router.post("/lessons/{lesson_id}/characters", response_model=CharacterOut, status_code=201)
def create_character(lesson_id: int, data: CharacterCreate, db: Session = Depends(get_db)):
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="课不存在")
    existing = db.query(Character).filter(Character.lesson_id == lesson_id, Character.char == data.char).first()
    if existing:
        raise HTTPException(status_code=400, detail="该课已包含此汉字")
    char = Character(
        lesson_id=lesson_id, char=data.char, pinyin=data.pinyin,
        word_1=data.word_1, word_2=data.word_2, word_3=data.word_3,
        char_type=data.char_type,
    )
    db.add(char)
    db.commit()
    db.refresh(char)
    return char


@router.put("/characters/{char_id}", response_model=CharacterOut)
def update_character(char_id: int, data: CharacterUpdate, db: Session = Depends(get_db)):
    char = db.query(Character).filter(Character.id == char_id).first()
    if not char:
        raise HTTPException(status_code=404, detail="汉字不存在")
    if data.char is not None:
        dup = db.query(Character).filter(
            Character.lesson_id == char.lesson_id, Character.char == data.char, Character.id != char_id
        ).first()
        if dup:
            raise HTTPException(status_code=400, detail="该课已包含此汉字")
        char.char = data.char
    if data.pinyin is not None:
        char.pinyin = data.pinyin
    if data.word_1 is not None:
        char.word_1 = data.word_1
    if data.word_2 is not None:
        char.word_2 = data.word_2
    if data.word_3 is not None:
        char.word_3 = data.word_3
    if data.char_type is not None:
        char.char_type = data.char_type
    db.commit()
    db.refresh(char)
    return char


@router.delete("/characters/{char_id}", status_code=204)
def delete_character(char_id: int, db: Session = Depends(get_db)):
    char = db.query(Character).filter(Character.id == char_id).first()
    if not char:
        raise HTTPException(status_code=404, detail="汉字不存在")
    db.delete(char)
    db.commit()


class BatchAddIn(BaseModel):
    chars: str = Field(..., min_length=1, max_length=100, description="汉字字符串，最多100个")


@router.post("/lessons/{lesson_id}/characters/batch", response_model=list[CharacterOut], status_code=201)
async def batch_create_characters(lesson_id: int, data: BatchAddIn, db: Session = Depends(get_db)):
    """Batch add characters with auto-lookup pinyin and words."""
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="课不存在")

    existing = {c.char for c in db.query(Character).filter(Character.lesson_id == lesson_id).all()}
    seen = set()
    unique_chars = []
    for ch in data.chars:
        if ch in seen or ch in existing:
            continue
        if len(ch) == 1 and ('一' <= ch <= '鿿' or '㐀' <= ch <= '䶿'):
            seen.add(ch)
            unique_chars.append(ch)

    if not unique_chars:
        return []

    lookups = await asyncio.gather(*[lookup_character(ch) for ch in unique_chars])

    created = []
    for info in lookups:
        char = Character(
            lesson_id=lesson_id,
            char=info["char"],
            pinyin=info["pinyin"] or "",
            word_1=info["word_1"] or "",
            word_2=info["word_2"] or None,
        )
        db.add(char)
        created.append(char)

    db.commit()
    for c in created:
        db.refresh(c)
    return created
