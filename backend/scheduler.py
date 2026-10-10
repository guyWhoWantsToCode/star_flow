import asyncio
import state
import db

QUEUE_MAX = 20
queues = {}

def rebuild_queues():
    queues.clear()
    for name in state.AGENTS:
        queues[name] = asyncio.Queue()

async def submit(agent):
    if agent not in state.AGENTS:
        raise RuntimeError(f"unknown agent: {agent}")

    a = state.AGENTS[agent]
    a["tried"] += 1

    if queues[agent].qsize() >= QUEUE_MAX:
        a["rejected"] += 1
        raise RuntimeError(f"{agent} rejected: queue full")

    ticket = asyncio.get_running_loop().create_future()
    await queues[agent].put(ticket)
    return await ticket

def _release(name):
    queues[name].get_nowait().set_result(True)
    state.AGENTS[name]["released"] += 1

async def run():
    while True:
        budget = state.LIMIT

        for name, a in state.AGENTS.items():
            for _ in range(min(a["share"], queues[name].qsize())):
                _release(name)
                budget -= 1

        while budget > 0 and any(not q.empty() for q in queues.values()):
            for name, q in queues.items():
                if budget == 0:
                    break
                if not q.empty():
                    _release(name)
                    budget -= 1

        state.tick_rates()
        try:
            db.write(state.snapshot()["agents"])
        except Exception:
            pass
        await asyncio.sleep(1)