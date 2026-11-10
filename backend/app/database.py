from urllib.parse import urlparse, parse_qs, urlencode, urlunparse
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import declarative_base
from app.config import get_settings

settings = get_settings()

db_url = settings.DATABASE_URL
# Automatically normalize Postgres URLs for asyncpg driver (Render/Neon/Supabase)
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql+asyncpg://", 1)
elif db_url.startswith("postgresql://") and not db_url.startswith("postgresql+asyncpg://"):
    db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)

parsed = urlparse(db_url)
query_dict = parse_qs(parsed.query)

# Determine SSL requirement and clean unsupported libpq flags (sslmode, channel_binding, etc.)
use_ssl = False
if "sslmode" in query_dict:
    if query_dict.get("sslmode", [""])[0] != "disable":
        use_ssl = True
elif "ssl" in query_dict:
    if query_dict.get("ssl", [""])[0].lower() not in ("0", "false", "disable"):
        use_ssl = True
elif parsed.hostname and parsed.hostname not in ("localhost", "127.0.0.1", "postgres"):
    use_ssl = True

# Strip query string from URL so asyncpg doesn't reject libpq-only parameters
db_url = urlunparse(parsed._replace(query=""))

connect_args = {}
if db_url.startswith("sqlite"):
    connect_args["check_same_thread"] = False
elif use_ssl:
    connect_args["ssl"] = "require"

engine = create_async_engine(
    db_url,
    echo=False,
    future=True,
    pool_pre_ping=not db_url.startswith("sqlite"),
    connect_args=connect_args,
)

async_session_maker = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)
AsyncSessionLocal = async_session_maker

Base = declarative_base()

async def get_db():
    async with async_session_maker() as session:
        try:
            yield session
        finally:
            await session.close()
