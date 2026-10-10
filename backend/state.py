import time

START = time.time()
LIMIT = 10

ROGUE = False

AGENTS = {
    "chatbot":  {"share": 5, "tried": 0, "released": 0, "rejected": 0},
    "summarizer": {"share": 3, "tried": 0, "released": 0, "rejected": 0,},
    "tagger": {"share": 2, "tried": 0, "released": 0, "rejected": 0}
}

EVENTS = []

def log(level, text):
    EVENTS.insert(0, {"t": int(time.time() -  START), "level": level, "text": text})
    del EVENTS[20:]

def snapshot():
    return {
        "t": int(time.time() - START),
        "limit": LIMIT,
        "agents": [{"id": k, **v} for k, v in AGENTS.items()],
        "events": EVENTS[:10]
    }