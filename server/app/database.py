from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

from .config import DATABASE_URL

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    Base.metadata.create_all(bind=engine)
    # Migration: add char_type column if missing
    with engine.connect() as conn:
        try:
            conn.execute(__import__('sqlalchemy').text(
                "ALTER TABLE characters ADD COLUMN char_type VARCHAR(10) NOT NULL DEFAULT 'new'"
            ))
            conn.commit()
        except Exception:
            pass  # Column already exists
