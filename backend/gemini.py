import asyncio
from google import genai
from dotenv import load_dotenv

load_dotenv()
client = genai.Client()

JOBS = {
    "chatbot":    "You are a customer support agent. Answer in two sentences: ",
    "summarizer": "Summarize this in one sentence: ",
    "tagger":     "Reply with one category word for this text: ",
}

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