import asyncio, logging, math, os, random
import state

log = logging.getLogger("starflow.demo")

def _flag(name, default):
    return os.environ.get(name, default).strip().lower() in ("1", "true", "yes", "on")

ENABLED = _flag("DEMO_MODE", "true")
USE_REAL_GEMINI = _flag("DEMO_USE_REAL_GEMINI", "false")
RATE = float(os.environ.get("DEMO_RATE", "4"))  # baseline total requests/sec

SPIKE_RATE = 15            # rogue agent req/s while spiking (vs a share of ~2-3)
SPIKE_SECONDS = 25
SPIKE_EVERY = (180, 300)   # seconds between spikes
FIRST_SPIKE = 40
MANUAL_ROGUE_TTL = 120     # a manually-set rogue flag auto-clears after this long
MAX_INFLIGHT = 100
PROMPTS = ["Where is my order?", "Reset my password", "Summarize the Q3 report", "Find the refund policy"]

async def run(ask):
    """Drive synthetic traffic through the real /ask handler, forever.

    Stub mode (default): the downstream is gemini.stub (sleeps, canned answer).
    DEMO_USE_REAL_GEMINI=true sends released requests to the real Gemini API.
    """
    owed = {}
    inflight = 0
    dropped = 0
    t = 0
    spike_at = FIRST_SPIKE
    spiking = None        # agent this generator made rogue, tracked independently of manual toggles
    spike_end = 0
    manual_agent = None
    manual_since = 0

    async def fire(agent):
        nonlocal inflight
        try:
            await ask(agent, random.choice(PROMPTS), USE_REAL_GEMINI, not USE_REAL_GEMINI)
        except Exception:
            pass
        finally:
            inflight -= 1

    while True:
        await asyncio.sleep(1)
        t += 1
        agents = list(state.AGENTS)
        if not agents:
            continue

        # a visitor's manual rogue flag must not stick forever
        cur = state.ROGUE
        if cur is not None and cur != spiking:
            if cur != manual_agent:
                manual_agent, manual_since = cur, t
            elif t - manual_since >= MANUAL_ROGUE_TTL:
                state.ROGUE = None
                state.log("info", "rogue OFF (auto-cleared)")
                manual_agent = None
        else:
            manual_agent = None

        # periodic spike, independent of any manual flag
        if spiking is None and t >= spike_at:
            spiking = random.choice(agents)
            spike_end = t + SPIKE_SECONDS
            state.ROGUE = spiking
            state.log("warn", f"{spiking} went rogue")
        elif spiking is not None and t >= spike_end:
            if state.ROGUE == spiking:
                state.ROGUE = None
                state.log("info", "rogue OFF")
            spiking = None
            spike_at = t + random.randint(*SPIKE_EVERY)

        total_share = sum(a["share"] for a in state.AGENTS.values()) or 1
        for i, (name, a) in enumerate(list(state.AGENTS.items())):
            wave = 0.55 + 0.45 * math.sin(t / 20 + i * 1.7)   # each agent ebbs and flows
            rate = RATE * a["share"] / total_share * wave * random.uniform(0.8, 1.2)
            if name == state.ROGUE:
                rate = SPIKE_RATE
            owed[name] = owed.get(name, 0) + rate
            n = int(owed[name])
            owed[name] -= n
            for _ in range(n):
                if inflight >= MAX_INFLIGHT:   # backpressure: drop and count, don't pile up tasks
                    dropped += 1
                    continue
                inflight += 1
                asyncio.create_task(fire(name))
        if t % 60 == 0 and dropped:
            log.warning("demo dropped %d requests (in-flight cap %d)", dropped, MAX_INFLIGHT)
            dropped = 0
