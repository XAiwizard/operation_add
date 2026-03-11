import sqlite3

# 프로젝트 루트에 ai_factory.db 파일이 생성됩니다.
DB_PATH = "ai_factory.db"

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """매핑 정보를 저장할 기초 테이블 생성"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS TB_COLUMN_MAP (
            MAP_ID INTEGER PRIMARY KEY AUTOINCREMENT,
            PROJECT_ID TEXT,
            PHYSICAL_COL_NM TEXT,
            LOGICAL_COL_NM TEXT,
            DATA_TYPE TEXT
        )
    """)
    conn.commit()
    conn.close()

# 앱 시작 시 초기 테이블 생성
init_db()