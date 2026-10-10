import asyncio
import state

QUEUE_MAX = 20
queues = {name: asyncio.Queue() for name in state.AGENTS}

async def submit(agent):
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
        await asyncio.sleep(1)