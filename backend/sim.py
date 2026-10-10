import asyncio, httpx

RATES = {"chatbot": 3, "summarizer": 2, "tagger": 2}
ROGUE_RATE = 20

async def fire(client, name, sem):
    async with sem:
        try:
            await client.get(f"http://localhost:8000/ask?agent={name}")
        except Exception:
            pass

async def agent_loop(name):
    sem = asyncio.Semaphore(40)
    limits = httpx.Limits(max_connections=60)
    async with httpx.AsyncClient(timeout=10, limits=limits) as client:
        while True:
            rogue = False
            try:
                r = await client.get("http://localhost:8000/rogue")
                rogue = r.json()["rogue"]
            except Exception:
                pass

            rate = ROGUE_RATE if (name == "tagger" and rogue) else RATES[name]
            for _ in range(rate):
                asyncio.create_task(fire(client, name, sem))
            await asyncio.sleep(1)

async def main():
    await asyncio.gather(*[agent_loop(n) for n in RATES])

asyncio.run(main())