import os
import sys
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

load_dotenv()

# reuse Drawing model from scripts/
sys.path.insert(0, str(Path(__file__).parent.parent.parent / "scripts"))
from ingest_mega_sena import Base, Drawing, init_db  # noqa: E402, F401

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./lotto.db")

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)

init_db(engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
