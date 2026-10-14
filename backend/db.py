import logging, os
import psycopg
from dotenv import load_dotenv

load_dotenv()
log = logging.getLogger("starflow.db")
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

_write_failures = 0

def write(agents):
    global _write_failures
    rows = [
        (a["id"], a["rate"]["tried"], a["rate"]["released"], a["rate"]["rejected"])
        for a in agents
    ]
    try:
        with conn.cursor() as cur:
            cur.executemany(
                "INSERT INTO metrics (t, agent, tried, released, rejected) VALUES (now(),%s,%s,%s,%s)",
                rows,
            )
        _write_failures = 0
    except Exception:
        # never break the scheduler, but don't fail silently: log the first failure, then once a minute
        if _write_failures % 60 == 0:
            log.exception("metrics write failed (%d consecutive)", _write_failures + 1)
        _write_failures += 1

def prune(hours=24):
    """Retention: delete metrics older than `hours`. Returns rows deleted."""
    with conn.cursor() as cur:
        cur.execute("DELETE FROM metrics WHERE t < now() - make_interval(hours => %s)", (hours,))
        return cur.rowcount

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