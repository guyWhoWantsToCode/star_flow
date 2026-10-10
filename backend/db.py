import os
import psycopg
from dotenv import load_dotenv

load_dotenv()
conn = psycopg.connect(os.environ["DATABASE_URL"], autocommit=True)

def setup():
    conn.execute("""
        CREATE TABLE IF NOT EXISTS metrics (
            t TIMESTAMPTZ NOT NULL,
            agent TEXT,
            tried INT,
            released INT,
            rejected INT
        )
    """)
    try:
        conn.execute("SELECT create_hypertable('metrics', 't')")
    except Exception:
        pass

def write(agents):
    rows = [
        (a["id"], a["rate"]["tried"], a["rate"]["released"], a["rate"]["rejected"])
        for a in agents
    ]
    with conn.cursor() as cur:
        cur.executemany(
            "INSERT INTO metrics (t, agent, tried, released, rejected) VALUES (now(),%s,%s,%s,%s)",
            rows,
        )

def history(seconds=60):
    with conn.cursor() as cur:
        cur.execute(
            "SELECT t, agent, released FROM metrics WHERE t > now() - make_interval(secs => %s) ORDER BY t",
            (seconds,),
        )
        return [
            {"t": r[0].isoformat(), "agent": r[1], "released": r[2]}
            for r in cur.fetchall()
        ]