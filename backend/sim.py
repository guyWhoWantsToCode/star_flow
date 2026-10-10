import asyncio, httpx

ROGUE_RATE = 20

async def fire(client, name, sem):
    async with sem:
        try:
            await client.get(f"http://localhost:8000/ask?agent={name}")
        except Exception:
            pass

async def main():
    sem = asyncio.Semaphore(60)
    limits = httpx.Limits(max_connections=120)
    async with httpx.AsyncClient(timeout=10, limits=limits) as client:
        while True:
            try:
                snap = (await client.get("http://localhost:8000/snapshot")).json()
                rogue = (await client.get("http://localhost:8000/rogue")).json()["rogue"]
            except Exception:
                await asyncio.sleep(1)
                continue

            agents = snap["agents"]
            last = agents[-1]["id"]

            for a in agents:
                rate = ROGUE_RATE if (a["id"] == last and rogue) else a["share"]
                for _ in range(rate):
                    asyncio.create_task(fire(client, a["id"], sem))

            await asyncio.sleep(1)

asyncio.run(main())