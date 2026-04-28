from datetime import datetime
from sqlalchemy import Integer, String, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..database import Base


class Character(Base):
    __tablename__ = "characters"
    __table_args__ = (UniqueConstraint("lesson_id", "char", name="uq_char_lesson"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    lesson_id: Mapped[int] = mapped_column(Integer, ForeignKey("lessons.id", ondelete="CASCADE"), nullable=False)
    char: Mapped[str] = mapped_column(String(1), nullable=False)
    pinyin: Mapped[str] = mapped_column(String(20), nullable=False)
    word_1: Mapped[str] = mapped_column(String(50), nullable=False)
    word_2: Mapped[str | None] = mapped_column(String(50), nullable=True)
    word_3: Mapped[str | None] = mapped_column(String(50), nullable=True)
    char_type: Mapped[str] = mapped_column(String(10), nullable=False, default="new")  # new, mistake, mastered
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    lesson = relationship("Lesson", back_populates="characters")
    review_logs = relationship("ReviewLog", back_populates="character", cascade="all, delete-orphan")
