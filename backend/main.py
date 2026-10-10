import asyncio
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import state
import scheduler
import gemini

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
async def ask(agent: str, text: str = "hello", real: bool = False):
    try:
        await scheduler.submit(agent)
    except RuntimeError as e:
        return {"ok": False, "error": str(e)}
    if not real:
        return {"ok": True}
    answer = await gemini.ask(agent, text)
    return {"ok": True, "answer": answer}

@app.post("/rogue")
async def set_rogue(on: bool):
    state.ROGUE = on
    state.log("warn" if on else "info", f"tagger rogue {'ON' if on else 'OFF'}")
    return {"rogue": on}

@app.get("/rogue")
async def get_rogue():
    return {"rogue": state.ROGUE}