import time

START = time.time()
LIMIT = 10

ROGUE = None

CATALOG = {
    "chatbot": "Customer chatbot", "triage": "Support triage", "search": "Doc search",
    "rerank": "Search reranker", "translate": "Translation worker", "moderate": "Content moderator",
    "fraud": "Fraud screener", "onboard": "Onboarding assistant", "alerts": "Alert explainer",
    "voice": "Voice call summarizer", "summarizer": "Email summarizer", "tagger": "Data tagger",
    "notes": "Meeting notes", "invoice": "Invoice parser", "resume": "Resume screener",
    "caption": "Image captioner", "sentiment": "Sentiment monitor", "lead": "Lead scorer",
    "review": "Code reviewer", "changelog": "Changelog writer",
}

AGENTS = {
    "chatbot":    {"share": 5, "tried": 0, "released": 0, "rejected": 0},
    "summarizer": {"share": 3, "tried": 0, "released": 0, "rejected": 0},
    "tagger":     {"share": 2, "tried": 0, "released": 0, "rejected": 0},
}

LAST = {name: dict(a) for name, a in AGENTS.items()}
RATES = {name: {"tried": 0, "released": 0, "rejected": 0} for name in AGENTS}

EVENTS = []

def log(level, text):
    EVENTS.insert(0, {"t": int(time.time() - START), "level": level, "text": text})
    del EVENTS[20:]

def set_agents(ids, shares):
    global ROGUE
    AGENTS.clear()
    LAST.clear()
    RATES.clear()
    for i, aid in enumerate(ids):
        AGENTS[aid] = {"share": shares[i], "tried": 0, "released": 0, "rejected": 0}
        LAST[aid] = dict(AGENTS[aid])
        RATES[aid] = {"tried": 0, "released": 0, "rejected": 0}
    if ROGUE not in AGENTS:
        ROGUE = None
    log("info", f"agents set to {', '.join(ids)}")

def tick_rates():
    """Called once a second by the scheduler: totals -> per-second rates."""
    for name, a in AGENTS.items():
        for k in ("tried", "released", "rejected"):
            RATES[name][k] = a[k] - LAST[name][k]
        LAST[name] = dict(a)

def snapshot():
    return {
        "t": int(time.time() - START),
        "limit": LIMIT,
        "rogue": ROGUE,
        "agents": [
            {"id": k, "name": CATALOG.get(k, k), **v, "rate": RATES[k]}
            for k, v in AGENTS.items()
        ],
        "events": EVENTS[:10],
    }