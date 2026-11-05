"""Import all models so Alembic and SQLAlchemy can discover them."""

from app.models.base import BaseModel  # noqa: F401
from app.models.user import User  # noqa: F401
from app.models.problem import Problem, TestCase  # noqa: F401
from app.models.match import Match  # noqa: F401
from app.models.submission import Submission, EloHistory  # noqa: F401
