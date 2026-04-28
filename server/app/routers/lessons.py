from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.volume import Volume
from ..models.lesson import Lesson
from ..models.character import Character
from ..schemas.lesson import LessonCreate, LessonUpdate, LessonOut

router = APIRouter(prefix="/api/v1", tags=["lessons"])


@router.get("/volumes/{volume_id}/lessons", response_model=list[LessonOut])
def list_lessons(volume_id: int, db: Session = Depends(get_db)):
    volume = db.query(Volume).filter(Volume.id == volume_id).first()
    if not volume:
        raise HTTPException(status_code=404, detail="册不存在")
    lessons = db.query(Lesson).filter(Lesson.volume_id == volume_id).order_by(Lesson.no).all()
    result = []
    for l in lessons:
        char_count = db.query(func.count(Character.id)).filter(Character.lesson_id == l.id).scalar() or 0
        result.append(LessonOut(
            id=l.id, volume_id=l.volume_id, no=l.no, created_at=l.created_at, char_count=char_count,
        ))
    return result


@router.post("/volumes/{volume_id}/lessons", response_model=LessonOut, status_code=201)
def create_lesson(volume_id: int, data: LessonCreate, db: Session = Depends(get_db)):
    volume = db.query(Volume).filter(Volume.id == volume_id).first()
    if not volume:
        raise HTTPException(status_code=404, detail="册不存在")
    existing = db.query(Lesson).filter(Lesson.volume_id == volume_id, Lesson.no == data.no).first()
    if existing:
        raise HTTPException(status_code=400, detail="该课号已存在")
    lesson = Lesson(volume_id=volume_id, no=data.no)
    db.add(lesson)
    db.commit()
    db.refresh(lesson)
    return LessonOut(id=lesson.id, volume_id=lesson.volume_id, no=lesson.no, created_at=lesson.created_at, char_count=0)


@router.put("/lessons/{lesson_id}", response_model=LessonOut)
def update_lesson(lesson_id: int, data: LessonUpdate, db: Session = Depends(get_db)):
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="课不存在")
    if data.no is not None:
        dup = db.query(Lesson).filter(Lesson.volume_id == lesson.volume_id, Lesson.no == data.no, Lesson.id != lesson_id).first()
        if dup:
            raise HTTPException(status_code=400, detail="该课号已存在")
        lesson.no = data.no
    db.commit()
    db.refresh(lesson)
    char_count = db.query(func.count(Character.id)).filter(Character.lesson_id == lesson.id).scalar() or 0
    return LessonOut(id=lesson.id, volume_id=lesson.volume_id, no=lesson.no, created_at=lesson.created_at, char_count=char_count)


@router.delete("/lessons/{lesson_id}", status_code=204)
def delete_lesson(lesson_id: int, db: Session = Depends(get_db)):
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="课不存在")
    db.delete(lesson)
    db.commit()
