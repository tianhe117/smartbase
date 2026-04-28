from datetime import datetime
from sqlalchemy import Integer, String, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..database import Base


class Volume(Base):
    __tablename__ = "volumes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    no: Mapped[int] = mapped_column(Integer, nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    lessons = relationship("Lesson", back_populates="volume", cascade="all, delete-orphan", order_by="Lesson.no")
