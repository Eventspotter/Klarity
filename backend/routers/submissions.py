"""Content submission and review-action endpoints."""

from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, selectinload

from database import get_db
from auth import Account, current_account, optional_account
from models import (
    ActionType,
    BrandGuideline,
    ContentSubmission,
    ContentType,
    ReviewAction,
    ReviewIssue,
    ReviewReport,
    SubmissionStatus,
)
from schemas import (
    ActionRequest,
    ContentSubmissionDetail,
    ContentSubmit,
)
from services.analyzer import analyse_content, rewrite_text_with_llm
from pydantic import BaseModel
from services.workspace import invalidate_bootstrap_cache

router = APIRouter(prefix="/api/submissions", tags=["submissions"])

STATUS_BY_ACTION = {
    ActionType.approved: SubmissionStatus.approved,
    ActionType.rejected: SubmissionStatus.rejected,
    ActionType.changes_requested: SubmissionStatus.needs_changes,
}


def _submission(db: Session, submission_id: int, account = None) -> ContentSubmission:
    submission = (
        db.query(ContentSubmission)
        .options(
            selectinload(ContentSubmission.reports).selectinload(ReviewReport.issues),
            selectinload(ContentSubmission.reports).selectinload(ReviewReport.actions),
        )
        .filter(ContentSubmission.id == submission_id)
        .first()
    )
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    # Broken Object-Level Authorization (BOLA) Check:
    # Non-admin users can only view or act on submissions within their brand workspace
    if account:
        is_demo = getattr(account, "is_demo", False) or getattr(account, "username", "") in ("ashwik", "sunless", "judge_owner", "judge_reviewer", "judge_member")
        account_brand = getattr(account, "brand_name", None) or "Aster & Oak"
        if not is_demo and submission.brand_name and submission.brand_name != account_brand:
            raise HTTPException(status_code=403, detail="Forbidden: You do not have access to this resource.")
    return submission


@router.get("", response_model=list[ContentSubmissionDetail])
def list_submissions(
    status: str | None = Query(default=None),
    search: str | None = Query(default=None),
    limit: int = Query(default=60, ge=1, le=200),
    account = Depends(optional_account),
    db: Session = Depends(get_db),
) -> list[ContentSubmission]:
    query = db.query(ContentSubmission).options(
        selectinload(ContentSubmission.reports).selectinload(ReviewReport.issues),
        selectinload(ContentSubmission.reports).selectinload(ReviewReport.actions),
    )
    from sqlalchemy import or_
    is_demo = getattr(account, "is_demo", False) or getattr(account, "username", "") in ("ashwik", "sunless", "judge_owner", "judge_reviewer", "judge_member") if account else True
    if is_demo:
        demo_brand = getattr(account, "brand_name", None) or "Aster & Oak"
        query = query.filter(or_(ContentSubmission.brand_name == demo_brand, ContentSubmission.brand_name == "Aster & Oak", ContentSubmission.brand_name.is_(None)))
    elif account and getattr(account, "brand_name", None):
        query = query.filter(ContentSubmission.brand_name == account.brand_name)
    if status and status != "all":
        try:
            query = query.filter(ContentSubmission.status == SubmissionStatus(status))
        except ValueError:
            raise HTTPException(status_code=422, detail="Unknown status filter")
    if search:
        pattern = f"%{search.strip()}%"
        query = query.filter(ContentSubmission.title.ilike(pattern))
    return query.order_by(ContentSubmission.submitted_at.desc()).limit(limit).all()


@router.get("/{submission_id}", response_model=ContentSubmissionDetail)
def get_submission(submission_id: int, db: Session = Depends(get_db), account = Depends(optional_account)) -> ContentSubmission:
    return _submission(db, submission_id, account=account)


@router.post("", response_model=ContentSubmissionDetail, status_code=201)
def create_submission(payload: ContentSubmit, db: Session = Depends(get_db), account: Account = Depends(current_account)) -> ContentSubmission:
    try:
        content_type = ContentType(payload.content_type)
    except ValueError:
        raise HTTPException(status_code=422, detail="Unknown content type")

    brand_name = getattr(account, "brand_name", None) or "Aster & Oak"
    submission = ContentSubmission(
        title=payload.title.strip(),
        content_type=content_type,
        content_text=payload.content_text.strip(),
        submitted_by=account.username,
        brand_name=brand_name,
        status=SubmissionStatus.reviewing,
        submitted_at=datetime.utcnow(),
    )
    db.add(submission)
    db.flush()

    result = analyse_content(db, submission.title, submission.content_text, content_type)
    report = ReviewReport(
        submission=submission,
        overall_score=result.score,
        summary=result.summary,
        created_at=datetime.utcnow(),
    )
    db.add(report)
    db.flush()

    for issue in result.issues:
        db.add(
            ReviewIssue(
                report=report,
                severity=issue.severity,
                category=issue.category,
                title=issue.title,
                description=issue.description,
                evidence=issue.evidence,
                suggested_fix=issue.suggested_fix,
                guideline_id=issue.guideline_id,
            )
        )

    db.commit()
    invalidate_bootstrap_cache()
    return _submission(db, submission.id)


@router.post("/{submission_id}/action", response_model=ContentSubmissionDetail)
def review_submission(
    submission_id: int,
    payload: ActionRequest,
    account: Account = Depends(current_account),
    db: Session = Depends(get_db),
) -> ContentSubmission:
    submission = _submission(db, submission_id, account=account)
    if not submission.reports:
        raise HTTPException(status_code=409, detail="Submission has no review report yet")

    report = max(submission.reports, key=lambda item: item.created_at)
    action = ReviewAction(
        report=report,
        action=payload.action,
        performed_by=account.username,
        comment=payload.comment.strip() if payload.comment else None,
        created_at=datetime.utcnow(),
    )
    db.add(action)
    submission.status = STATUS_BY_ACTION[payload.action]
    submission.reviewed_at = datetime.utcnow()
    submission.reviewer_notes = action.comment
    db.commit()
    invalidate_bootstrap_cache()
    return _submission(db, submission.id)


class RewriteRequest(BaseModel):
    text: str
    brand_name: str | None = None
    brand_values: str | None = None
    guidelines_text: str | None = None


class RewriteResponse(BaseModel):
    rewritten_text: str


@router.post("/rewrite", response_model=RewriteResponse)
def rewrite_copy(
    payload: RewriteRequest,
    account: Account = Depends(current_account),
    db: Session = Depends(get_db),
) -> RewriteResponse:
    """Use Gemini AI to rewrite draft text copy to align with brand guidelines."""
    brand = payload.brand_name or getattr(account, "brand", "Aster & Oak")
    guidelines = db.query(BrandGuideline).order_by(BrandGuideline.priority.desc()).all()
    gl_summary = payload.guidelines_text or "\n".join([f"- [{g.category.value}] {g.title}: {g.content}" for g in guidelines])
    rewritten = rewrite_text_with_llm(
        text=payload.text,
        brand_name=brand,
        brand_values=payload.brand_values or "Rooted, mindful, natural, thoughtful craftsmanship, certified sustainability.",
        guidelines_text=gl_summary,
    )
    return RewriteResponse(rewritten_text=rewritten)


@router.post("/{submission_id}/re-evaluate", response_model=ContentSubmissionDetail)
def reevaluate_submission(
    submission_id: int,
    account: Account = Depends(current_account),
    db: Session = Depends(get_db),
) -> ContentSubmission:
    """Trigger AI generation of the review report score and analysis for this submission."""
    if getattr(account, "role", "member") not in ("owner", "admin", "lead"):
        raise HTTPException(403, "Only Brand Owners and Admins can trigger AI score generation.")

    submission = _submission(db, submission_id)
    result = analyse_content(db, submission.title, submission.content_text, submission.content_type)

    report = ReviewReport(
        submission=submission,
        overall_score=result.score,
        summary=result.summary,
        created_at=datetime.utcnow(),
    )
    db.add(report)
    db.flush()

    for issue in result.issues:
        db.add(
            ReviewIssue(
                report=report,
                severity=issue.severity,
                category=issue.category,
                title=issue.title,
                description=issue.description,
                evidence=issue.evidence,
                suggested_fix=issue.suggested_fix,
                guideline_id=issue.guideline_id,
            )
        )

    db.commit()
    invalidate_bootstrap_cache()
    return _submission(db, submission.id)
