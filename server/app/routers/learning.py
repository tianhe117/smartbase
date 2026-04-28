from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.volume import Volume
from ..models.lesson import Lesson
from ..models.character import Character
from ..schemas.character import CharacterOut

router = APIRouter(prefix="/api/v1/learning", tags=["learning"])


@router.get("/volume/{volume_id}", response_model=list[CharacterOut])
def get_learning_chars(volume_id: int, db: Session = Depends(get_db)):
    """Get all characters in a volume, ordered by lesson then by id."""
    volume = db.query(Volume).filter(Volume.id == volume_id).first()
    if not volume:
        raise HTTPException(status_code=404, detail="册不存在")
    chars = (
        db.query(Character)
        .join(Lesson, Character.lesson_id == Lesson.id)
        .filter(Lesson.volume_id == volume_id)
        .order_by(Lesson.no, Character.id)
        .all()
    )
    return chars
