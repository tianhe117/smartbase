from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.character import Character
from ..models.review_log import ReviewLog
from ..services.review import select_review_chars, get_review_stats
from ..schemas.review import ReviewResultIn, ReviewCharOut, ReviewStatsOut

router = APIRouter(prefix="/api/v1/review", tags=["review"])


@router.get("/next", response_model=list[ReviewCharOut])
def get_next_review(volume_id: int, count: int = 20, db: Session = Depends(get_db)):
    """Get next batch of characters for review using spaced repetition."""
    chars = select_review_chars(db, volume_id, count)
    return chars


@router.post("/result", status_code=201)
def submit_review_result(data: ReviewResultIn, db: Session = Depends(get_db)):
    """Submit a review result (known/unknown) for a character."""
    char = db.query(Character).filter(Character.id == data.character_id).first()
    if not char:
        raise HTTPException(status_code=404, detail="汉字不存在")

    # Get latest review to determine counts
    latest = (
        db.query(ReviewLog)
        .filter(ReviewLog.character_id == data.character_id)
        .order_by(ReviewLog.created_at.desc())
        .first()
    )

    if latest is None:
        known_count = 1 if data.known else 0
        unknown_count = 0 if data.known else 1
    elif data.known:
        known_count = (latest.known_count + 1) if latest.known else 1
        unknown_count = 0
    else:
        known_count = 0
        unknown_count = (latest.unknown_count + 1) if not latest.known else 1

    log = ReviewLog(
        character_id=data.character_id,
        known=data.known,
        known_count=known_count,
        unknown_count=unknown_count,
    )
    db.add(log)
    db.commit()

    return {"ok": True, "known_count": known_count, "unknown_count": unknown_count}


@router.get("/stats", response_model=ReviewStatsOut)
def get_stats(volume_id: int, db: Session = Depends(get_db)):
    """Get review statistics for a volume."""
    stats = get_review_stats(db, volume_id)
    return stats
