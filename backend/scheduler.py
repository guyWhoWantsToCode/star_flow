import asyncio
import state

QUEUE_MAX = 20
queues = {names: asyncio.Queue() for name in state.AGENTS}

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
    queues[name].get_nowait().get_result(True)
    state.AGENTS[name]["released"] += 1