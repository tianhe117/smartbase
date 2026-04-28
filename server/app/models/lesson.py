from datetime import datetime
from sqlalchemy import Integer, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..database import Base


class Lesson(Base):
    __tablename__ = "lessons"
    __table_args__ = (UniqueConstraint("volume_id", "no", name="uq_lesson_volume_no"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    volume_id: Mapped[int] = mapped_column(Integer, ForeignKey("volumes.id", ondelete="CASCADE"), nullable=False)
    no: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    volume = relationship("Volume", back_populates="lessons")
    characters = relationship("Character", back_populates="lesson", cascade="all, delete-orphan", order_by="Character.id")
