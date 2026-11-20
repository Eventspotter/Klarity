"""Brand guideline CRUD endpoints."""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from database import get_db
from models import BrandGuideline
from schemas import GuidelineCreate, GuidelineOut, GuidelineUpdate
from services.workspace import invalidate_bootstrap_cache

from auth import optional_account

router = APIRouter(prefix="/api/guidelines", tags=["guidelines"])


@router.get("", response_model=list[GuidelineOut])
def list_guidelines(
    category: str | None = Query(default=None),
    search: str | None = Query(default=None),
    account = Depends(optional_account),
    db: Session = Depends(get_db),
) -> list[BrandGuideline]:
    query = db.query(BrandGuideline)
    from sqlalchemy import or_
    is_demo = getattr(account, "is_demo", False) or getattr(account, "username", "") in ("ashwik", "sunless") if account else True
    if is_demo:
        demo_brand = getattr(account, "brand_name", None) or "Aster & Oak"
        query = query.filter(or_(BrandGuideline.brand_name == demo_brand, BrandGuideline.brand_name == "Aster & Oak", BrandGuideline.brand_name.is_(None)))
    elif account and getattr(account, "brand_name", None):
        query = query.filter(BrandGuideline.brand_name == account.brand_name)
    if category and category != "all":
        query = query.filter(BrandGuideline.category == category)
    if search:
        pattern = f"%{search.strip()}%"
        query = query.filter(BrandGuideline.title.ilike(pattern))
    return query.order_by(BrandGuideline.priority.desc(), BrandGuideline.updated_at.desc()).all()


@router.get("/{guideline_id}", response_model=GuidelineOut)
def get_guideline(guideline_id: int, db: Session = Depends(get_db)) -> BrandGuideline:
    guideline = db.get(BrandGuideline, guideline_id)
    if not guideline:
        raise HTTPException(status_code=404, detail="Guideline not found")
    return guideline


@router.post("", response_model=GuidelineOut, status_code=201)
def create_guideline(payload: GuidelineCreate, account = Depends(optional_account), db: Session = Depends(get_db)) -> BrandGuideline:
    brand_name = getattr(account, "brand_name", None) if account else "Aster & Oak"
    if not brand_name:
        brand_name = "Aster & Oak"
    guideline = BrandGuideline(
        title=payload.title.strip(),
        category=payload.category,
        content=payload.content.strip(),
        priority=payload.priority,
        brand_name=brand_name,
    )
    db.add(guideline)
    db.commit()
    db.refresh(guideline)
    invalidate_bootstrap_cache()
    return guideline


@router.patch("/{guideline_id}", response_model=GuidelineOut)
def update_guideline(
    guideline_id: int,
    payload: GuidelineUpdate,
    db: Session = Depends(get_db),
) -> BrandGuideline:
    guideline = db.get(BrandGuideline, guideline_id)
    if not guideline:
        raise HTTPException(status_code=404, detail="Guideline not found")
    updates = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(guideline, field, value)
    db.commit()
    db.refresh(guideline)
    invalidate_bootstrap_cache()
    return guideline


@router.delete("/{guideline_id}", status_code=204)
def delete_guideline(guideline_id: int, db: Session = Depends(get_db)) -> None:
    guideline = db.get(BrandGuideline, guideline_id)
    if not guideline:
        raise HTTPException(status_code=404, detail="Guideline not found")
    db.delete(guideline)
    db.commit()
    invalidate_bootstrap_cache()
