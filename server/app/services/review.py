import math
import random
from datetime import datetime

from sqlalchemy import func, desc
from sqlalchemy.orm import Session

from ..models.character import Character
from ..models.review_log import ReviewLog
from ..models.lesson import Lesson


def get_latest_review(db: Session, character_id: int) -> ReviewLog | None:
    return (
        db.query(ReviewLog)
        .filter(ReviewLog.character_id == character_id)
        .order_by(desc(ReviewLog.created_at))
        .first()
    )


def calculate_weight(char_id: int, latest: ReviewLog | None) -> float:
    """Calculate selection weight for a character in review queue.

    Weight = W_result × W_time × W_new

    - W_result: based on consecutive known/unknown count
    - W_time: time since last review
    - W_new: boost for never-reviewed characters
    """
    if latest is None:
        # New character: moderate base weight + new boost
        return 1.0 * 1.0 * 5.0  # W_result=1, W_time=1, W_new=5

    now = datetime.utcnow()
    hours_since = max(0.01, (now - latest.created_at).total_seconds() / 3600)

    # W_time: logarithmic time decay recovery
    w_time = 1 + math.log(1 + hours_since) * 0.3

    if not latest.known:
        # Unknown: high weight, grows with consecutive unknowns
        n = latest.unknown_count
        w_result = min(100.0, 10.0 * (1.5 ** n))
    else:
        # Known: low weight, decreases with consecutive knowns
        n = latest.known_count
        w_result = max(0.05, 1.0 / (1.8 ** n))

    return w_result * w_time


def select_review_chars(
    db: Session,
    volume_id: int,
    count: int = 20,
    lesson_ids: list[int] | None = None,
) -> list[dict]:
    """Select characters for review using weighted random sampling."""
    # Get characters in this volume (optionally filtered by lessons)
    query = (
        db.query(Character, Lesson.no.label("lesson_no"))
        .join(Lesson, Character.lesson_id == Lesson.id)
        .filter(Lesson.volume_id == volume_id)
    )
    if lesson_ids:
        query = query.filter(Lesson.id.in_(lesson_ids))
    chars = query.all()

    if not chars:
        return []

    # Calculate weights for each character
    weighted_chars = []
    for char_obj, lesson_no in chars:
        latest = get_latest_review(db, char_obj.id)
        weight = calculate_weight(char_obj.id, latest)
        weighted_chars.append({
            "id": char_obj.id,
            "char": char_obj.char,
            "pinyin": char_obj.pinyin,
            "word_1": char_obj.word_1,
            "word_2": char_obj.word_2,
            "word_3": char_obj.word_3,
            "lesson_no": lesson_no,
            "weight": round(weight, 3),
        })

    # Weighted random sampling without replacement
    selected = []
    pool = list(weighted_chars)
    num_to_select = min(count, len(pool))

    for _ in range(num_to_select):
        weights = [c["weight"] for c in pool]
        total = sum(weights)
        if total == 0:
            break
        r = random.uniform(0, total)
        cumulative = 0.0
        for i, w in enumerate(weights):
            cumulative += w
            if r <= cumulative:
                selected.append(pool.pop(i))
                break

    return selected


def get_review_stats(db: Session, volume_id: int) -> dict:
    """Get review statistics for a volume."""
    chars = (
        db.query(Character.id)
        .join(Lesson, Character.lesson_id == Lesson.id)
        .filter(Lesson.volume_id == volume_id)
        .all()
    )
    char_ids = [c.id for c in chars]
    total = len(char_ids)

    if total == 0:
        return {"total_chars": 0, "mastered": 0, "learning": 0, "unfamiliar": 0, "new_chars": 0}

    # Get latest review for each character
    mastered = 0
    learning = 0
    unfamiliar = 0
    new_chars = 0

    for cid in char_ids:
        latest = get_latest_review(db, cid)
        if latest is None:
            new_chars += 1
        elif latest.known and latest.known_count >= 5:
            mastered += 1
        elif latest.unknown_count > 0 and latest.known_count < 3:
            unfamiliar += 1
        else:
            learning += 1

    return {
        "total_chars": total,
        "mastered": mastered,
        "learning": learning,
        "unfamiliar": unfamiliar,
        "new_chars": new_chars,
    }
