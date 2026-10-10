import asyncio
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import state
import scheduler

@asynccontextmanager
async def lifespan(app):
    task = asyncio.create_task(scheduler.run())
    yield
    task.cancel()

app = FastAPI(lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

@app.websocket("/ws")
async def ws(sock: WebSocket):
    await sock.accept()
    while True:
        await sock.send_json(state.snapshot())
        await asyncio.sleep(0.5)

@app.get("/ask")
async def ask(agent: str):
    try:
        await scheduler.submit(agent)
        return {"ok": True}
    except RuntimeError as e:
        return {"ok": False, "error": str(e)}