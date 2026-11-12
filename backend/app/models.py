from datetime import datetime, timezone
from uuid import uuid4

from sqlmodel import Field, SQLModel


class Job(SQLModel, table=True):
    """Một lần upload video = một job. Class này vừa là bảng database vừa là JSON trả về."""

    id: str = Field(default_factory=lambda: uuid4().hex, primary_key=True)
    filename: str
    status: str = "queued"  # queued -> processing -> done | failed
    progress: float = 0
    plate_frames: int | None = None
    error: str | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
