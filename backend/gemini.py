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
    r = await client.aio.interactions.create(
        model="gemini-3.8-flash",
        input=prompt
    )
    return r.output_text