from sqlmodel import Session, SQLModel, create_engine

from app.config import DATABASE_URL

# SQLite mặc định chỉ cho 1 thread dùng kết nối; API + worker là nhiều thread nên tắt kiểm tra này
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args)


def init_db() -> None:
    """Tạo bảng nếu chưa có."""
    SQLModel.metadata.create_all(engine)


def get_session():
    """Mỗi request có 1 session riêng, tự đóng khi request xong."""
    with Session(engine) as session:
        yield session
