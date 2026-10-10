import asyncio
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
import state

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
@app.websocket("/ws")
async def ws(sock: WebSocket):
    await sock.accept()
    while True:
        await sock.send_json(state.snapshot())
        await asyncio.sleep(0.5)