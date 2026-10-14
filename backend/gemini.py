import asyncio, random
from google import genai
from dotenv import load_dotenv

load_dotenv()
client = genai.Client()

JOBS = {
    "chatbot":    "You are a customer support agent. Answer in two sentences: ",
    "summarizer": "Summarize this in one sentence: ",
    "tagger":     "Reply with one category word for this text: ",
    "triage":     "Classify this support ticket as billing, bug, or how-to in one word: ",
    "search":     "Rewrite this as a concise search query: ",
    "rerank":     "Reply with a relevance score from 1 to 10 for this text: ",
}

async def stub(agent, text):
    """Demo downstream: realistic Gemini latency, canned answer, no API call."""
    await asyncio.sleep(random.uniform(0.4, 1.2))
    return "[demo] canned response"

async def ask(agent, text):
    prompt = JOBS.get(agent, "Reply in one short sentence: ") + text
    try:
        r = await asyncio.wait_for(
            client.aio.interactions.create(
                model="gemini-3.5-flash-lite",
                input=prompt
            ),
            timeout=15,
        )
        return r.output_text
    except asyncio.TimeoutError:
        return "[rate limited or slow]"
    except Exception as e:
        return f"[error: {type(e).__name__}: {e}]"