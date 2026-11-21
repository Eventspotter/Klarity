"""Dashboard and workspace bootstrap endpoints."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from schemas import BootstrapOut
from services.workspace import build_bootstrap
from auth import optional_account

router = APIRouter(prefix="/api", tags=["dashboard"])


@router.get("/bootstrap", response_model=BootstrapOut)
def bootstrap(db: Session = Depends(get_db), account = Depends(optional_account)) -> BootstrapOut:
    """One request returns everything the workspace needs to render."""

    return build_bootstrap(db, account=account)


@router.get("/dashboard", response_model=BootstrapOut)
def dashboard(db: Session = Depends(get_db), account = Depends(optional_account)) -> BootstrapOut:
    return build_bootstrap(db, account=account)
