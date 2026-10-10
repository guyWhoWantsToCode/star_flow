import asyncio, httpx

RATES = {
    "chatbot": 3,
    "summarizer": 2,
    "tagger": 2
}
ROUGE_RATE = 50

rogue = False

async def agent_loop(client, name):
    while True:
        rate = ROUGE_RATE if (name == "tagger" and rogue) else RATES[name]
        for _ in range(rate):
            asyncio.create_task(client.get(f"http://localhost:8000/ask?agent={name}"))
        await asyncio.sleep(1)

async def main():
    async with httpx.AsyncClient(timeout=60) as client:
        tasks = [asyncio.create_task(agent_loop(client, n)) for n in RATES]
        await asyncio.gather(*tasks)

asyncio.run(main())
