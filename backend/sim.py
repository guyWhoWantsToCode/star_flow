import asyncio, os, httpx

BASE = os.environ.get("STARFLOW_URL", "http://localhost:8000")
ROGUE_RATE = 20

async def fire(client, name, sem):
    async with sem:
        try:
            await client.get(f"{BASE}/ask?agent={name}")
        except Exception:
            pass

async def main():
    print(f"hitting {BASE}")
    sem = asyncio.Semaphore(60)
    limits = httpx.Limits(max_connections=120)
    async with httpx.AsyncClient(timeout=10, limits=limits) as client:
        while True:
            try:
                snap = (await client.get(f"{BASE}/snapshot")).json()
            except Exception:
                await asyncio.sleep(1)
                continue

            rogue = snap.get("rogue")

            for a in snap["agents"]:
                rate = ROGUE_RATE if a["id"] == rogue else a["share"]
                for _ in range(rate):
                    asyncio.create_task(fire(client, a["id"], sem))

            await asyncio.sleep(1)

asyncio.run(main())