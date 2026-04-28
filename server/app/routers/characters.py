from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.lesson import Lesson
from ..models.character import Character
from ..schemas.character import CharacterCreate, CharacterUpdate, CharacterOut

router = APIRouter(prefix="/api/v1", tags=["characters"])


@router.get("/lessons/{lesson_id}/characters", response_model=list[CharacterOut])
def list_characters(lesson_id: int, db: Session = Depends(get_db)):
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="课不存在")
    chars = db.query(Character).filter(Character.lesson_id == lesson_id).order_by(Character.id).all()
    return chars


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
