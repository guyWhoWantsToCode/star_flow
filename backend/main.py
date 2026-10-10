import asyncio
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import state
import scheduler
import gemini
import db

@asynccontextmanager
async def lifespan(app):
    scheduler.rebuild_queues()
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
    state.log("warn" if on else "info", f"rogue {'ON' if on else 'OFF'}")
    return {"rogue": on}

@app.get("/rogue")
async def get_rogue():
    return {"rogue": state.ROGUE}

@app.post("/agents")
async def set_agents(ids: str, shares: str):
    id_list = [s.strip() for s in ids.split(",")]
    share_list = [int(s) for s in shares.split(",")]
    if len(id_list) != len(share_list):
        return {"ok": False, "error": "ids and shares must be the same length"}
    if not 3 <= len(id_list) <= 5:
        return {"ok": False, "error": "pick 3 to 5 agents"}
    if sum(share_list) > state.LIMIT:
        return {"ok": False, "error": f"shares exceed limit of {state.LIMIT}/s"}
    state.set_agents(id_list, share_list)
    scheduler.rebuild_queues()
    return {"ok": True}

@app.post("/shares")
async def set_shares(ids: str, shares: str):
    id_list = [s.strip() for s in ids.split(",")]
    share_list = [int(s) for s in shares.split(",")]
    if sum(share_list) > state.LIMIT:
        return {"ok": False, "error": f"shares exceed limit of {state.LIMIT}/s"}
    for aid, sh in zip(id_list, share_list):
        if aid in state.AGENTS:
            state.AGENTS[aid]["share"] = sh
    state.log("info", f"shares set to {shares}")
    return {"ok": True}

@app.get("/catalog")
async def catalog():
    return state.CATALOG

@app.get("/history")
async def history():
    return db.history(60)

@app.get("/snapshot")
async def snapshot():
    return state.snapshot()