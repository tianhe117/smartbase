from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.volume import Volume
from ..models.lesson import Lesson
from ..models.character import Character
from ..schemas.volume import VolumeCreate, VolumeUpdate, VolumeOut

router = APIRouter(prefix="/api/v1/volumes", tags=["volumes"])


@router.get("", response_model=list[VolumeOut])
def list_volumes(db: Session = Depends(get_db)):
    volumes = db.query(Volume).order_by(Volume.sort_order).all()
    result = []
    for v in volumes:
        lesson_count = db.query(func.count(Lesson.id)).filter(Lesson.volume_id == v.id).scalar() or 0
        char_count = (
            db.query(func.count(Character.id))
            .join(Lesson, Character.lesson_id == Lesson.id)
            .filter(Lesson.volume_id == v.id)
            .scalar()
            or 0
        )
        result.append(VolumeOut(
            id=v.id, no=v.no, name=v.name, sort_order=v.sort_order,
            created_at=v.created_at, lesson_count=lesson_count, char_count=char_count,
        ))
    return result


@router.post("", response_model=VolumeOut, status_code=201)
def create_volume(data: VolumeCreate, db: Session = Depends(get_db)):
    volume = Volume(no=data.no, name=data.name, sort_order=data.no)
    db.add(volume)
    db.commit()
    db.refresh(volume)
    return VolumeOut(
        id=volume.id, no=volume.no, name=volume.name, sort_order=volume.sort_order,
        created_at=volume.created_at, lesson_count=0, char_count=0,
    )


@router.put("/{volume_id}", response_model=VolumeOut)
def update_volume(volume_id: int, data: VolumeUpdate, db: Session = Depends(get_db)):
    volume = db.query(Volume).filter(Volume.id == volume_id).first()
    if not volume:
        raise HTTPException(status_code=404, detail="册不存在")
    if data.no is not None:
        volume.no = data.no
        volume.sort_order = data.no
    if data.name is not None:
        volume.name = data.name
    db.commit()
    db.refresh(volume)
    lesson_count = db.query(func.count(Lesson.id)).filter(Lesson.volume_id == volume.id).scalar() or 0
    char_count = (
        db.query(func.count(Character.id))
        .join(Lesson, Character.lesson_id == Lesson.id)
        .filter(Lesson.volume_id == volume.id)
        .scalar()
        or 0
    )
    return VolumeOut(
        id=volume.id, no=volume.no, name=volume.name, sort_order=volume.sort_order,
        created_at=volume.created_at, lesson_count=lesson_count, char_count=char_count,
    )


@router.delete("/{volume_id}", status_code=204)
def delete_volume(volume_id: int, db: Session = Depends(get_db)):
    volume = db.query(Volume).filter(Volume.id == volume_id).first()
    if not volume:
        raise HTTPException(status_code=404, detail="册不存在")
    db.delete(volume)
    db.commit()
