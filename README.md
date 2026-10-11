# StarFlow

**One API. Multiple agents. Protected access.**

StarFlow manages how multiple AI agents share limited access to Google's Gemini API. Each agent has its own queue and an assigned share of request capacity. When one agent is quiet, its unused capacity goes to agents with waiting requests.

The idea comes from an **acequia**, a traditional community irrigation system: protect each farm's share of water, then let unused water flow where it is needed. StarFlow applies that principle to AI requests.

## The problem

When several agents share limited API capacity, one agent stuck retrying or sending too many requests can interrupt unrelated features. StarFlow schedules requests before they reach the model, helping keep an overloaded agent from taking over the shared capacity.

## Features

- Choose **3–4 agents from a 20-service catalog**, with Customer chatbot included.
- Start with evenly divided shares and adjust them from the dashboard.
- Release requests within a shared **10-request-per-second** scheduler budget.
- Distribute unused capacity among queues that still need it.
- Limit each agent's waiting queue to **20 requests**; reject additional requests when it is full.
- Display live per-second request counts, current waiting counts, and backend events.
- Enable rogue traffic for an active agent and watch its badge and colored connection follow its server-reported ID.
- Send real prompts to Gemini through the scheduler.
- Save request activity in TigerData for historical inspection.
- Explore a shared space theme with a rotating Earth, planetary orbits, animated service artwork, and a 3D dashboard station.

## Architecture

```mermaid
flowchart LR
    UI[React mission control] -->|HTTP requests| API[FastAPI backend]
    SIM[Optional traffic simulator] --> API
    API --> Q[Separate agent queues]
    Q --> S[StarFlow scheduler]
    S -->|Released real prompt| G[Gemini API]
    G -->|Answer| API
    API -->|Answer| UI
    S -->|Per-second request counts| DB[TigerData / PostgreSQL]
    API -->|Snapshots over WebSocket| UI
    DB -->|Recent history| API
```

**FastAPI** receives requests and exposes configuration, snapshots, history, and live updates. The scheduler first releases each queue's assigned share, then distributes remaining capacity in round-robin order. It repeats this process approximately once per second.

**Gemini** generates answers after the scheduler releases a real request. Customer chatbot, Email summarizer, and Data tagger have dedicated prompt instructions; other catalog services currently use a general short-response instruction. The model identifier is configured in `backend/gemini.py`.

**TigerData** stores timestamped per-second counts for attempted, released, and rejected requests. The backend uses psycopg and creates a time-series hypertable when the database supports it. `/history` returns released-request history for the last 60 seconds.

The dashboard uses the backend snapshot as its source of truth. Cards come from `snapshot.agents`, and rogue styling comes from comparing each agent's ID with `snapshot.rogue`.

## Technology

| Layer | Tools |
| --- | --- |
| Frontend | React, TypeScript/JavaScript, Vite, Tailwind CSS, CSS |
| Visuals | Three.js, WebGL, Canvas, SVG |
| Backend | Python, FastAPI, asyncio, Uvicorn |
| AI | Google Gemini API through the Google Gen AI SDK |
| History | TigerData / PostgreSQL, psycopg |
| Live updates | WebSocket snapshots every 0.5 seconds |

## Run the frontend

Use a recent Node.js release supported by Vite 8; Node.js 22.12+ or Node.js 24 LTS is a suitable choice.

```sh
git clone https://github.com/guyWhoWantsToCode/star_flow.git
cd star_flow/frontend
npm ci
npm run dev
```

Open the URL printed by Vite. Its port may change if another application is already using the default port.

| Route | Page |
| --- | --- |
| `/` | Landing page and system overview |
| `/setup` | Agent catalog and mission configuration |
| `/dashboard` | Live mission control, prompt form, and traffic controls |

The frontend currently uses these endpoints in both development and production:

```text
HTTPS:     https://starflow-production-7ca6.up.railway.app
WebSocket: wss://starflow-production-7ca6.up.railway.app/ws
```

No Gemini key is needed in the frontend, and starting Vite does not start a backend. The addresses are defined in `frontend/src/services/starflowApi.ts`; environment overrides and local API proxies are not currently configured.

## Run your own backend

You need Python 3.10+, a Gemini API key, and a reachable TigerData/PostgreSQL database. These steps run your own instance; they are not required to use the deployed backend.

From the repository root:

```sh
python3 -m venv venv
source venv/bin/activate
python -m pip install -r backend/requirements.txt
```

On Windows, activate the environment with `venv\Scripts\activate` instead.

Create a root `.env` file with your own credentials:

```dotenv
GEMINI_API_KEY=your_gemini_api_key
DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require
```

Keep this file private. The Gen AI SDK reads the Gemini key from the backend environment; it must not be placed in a `VITE_` variable or bundled into browser code.

Initialize the database table before starting the API:

```sh
cd backend
python -c "import db; db.setup()"
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

Database setup is an explicit step: the current application startup does not call `db.setup()`. The backend also connects to the database during import, so `DATABASE_URL` must be valid before startup.

For local API inspection, open `http://localhost:8000/docs` or `http://localhost:8000/snapshot`. To connect the frontend to this instance, update its HTTP and WebSocket addresses together. An HTTPS-hosted frontend needs HTTPS/WSS backend endpoints.

## Traffic demo

The rogue toggle changes which agent the simulator should flood. **The simulator must be running to generate that traffic.** It submits scheduler requests without asking Gemini for model responses.

With the backend running, open another terminal and activate the same Python environment:

```sh
cd backend
python sim.py
```

The simulator defaults to `http://localhost:8000`. To use a different backend, set `STARFLOW_URL` in that terminal:

```sh
export STARFLOW_URL=https://your-backend.example
python sim.py
```

A suggested demo:

1. Click **Launch Mission**, choose 3–4 services including Customer chatbot, then click **Get Started**.
2. Watch each card's live counts and connected request paths.
3. Enable rogue mode for an active agent. The simulator attempts **20 requests per second** for that agent, while normal agents generate traffic according to their shares.
4. Watch the busy agent's queue and rejections while the other agents retain their access.
5. Switch rogue mode to a different agent and confirm the badge and red pipe follow it.
6. Submit a prompt to receive a real Gemini answer.

Selecting agents and changing shares affect the shared backend instance, so coordinate configuration changes during a team demo.

## API reference

Examples below show request paths relative to the backend base URL.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/catalog` | All available services as `{id: displayName}` |
| GET | `/snapshot` | Current agents, rates, totals, rogue ID, and events |
| WebSocket | `/ws` | Stream scheduler snapshots |
| POST | `/agents?ids=chatbot,summarizer,tagger&shares=5,3,2` | Replace the active lineup and shares |
| POST | `/shares?ids=chatbot,summarizer,tagger&shares=5,3,2` | Update active agents' shares |
| POST | `/rogue?on=true&agent=tagger` | Set the rogue agent |
| POST | `/rogue?on=false&agent=tagger` | Disable rogue mode |
| GET | `/rogue` | Current rogue agent ID or `null` |
| GET | `/ask?agent=chatbot&text=Hello&real=true` | Schedule a request and ask Gemini |
| GET | `/ask?agent=chatbot` | Schedule a request without invoking Gemini |
| GET | `/history` | Last 60 seconds of released-request history |

IDs and shares are comma-separated lists in matching order. The frontend validates nonnegative integer shares totaling no more than the snapshot's capacity. It requires 3–4 agents including chatbot; the backend `/agents` endpoint currently accepts 3–5 agents.

### Reading a snapshot

```json
{
  "t": 268,
  "limit": 10,
  "rogue": null,
  "agents": [
    {
      "id": "chatbot",
      "name": "Customer chatbot",
      "share": 5,
      "tried": 425,
      "released": 425,
      "rejected": 0,
      "rate": { "tried": 5, "released": 5, "rejected": 0 }
    }
  ],
  "events": []
}
```

This is an illustrative payload, not application fallback data. Top-level agent counters are lifetime totals for the current lineup; `rate` contains counts from the latest scheduler interval. The dashboard calculates waiting requests as `max(0, tried - released - rejected)`.

**Released means permitted to access the API, not that Gemini has completed the response.** The animated dashboard packets represent released requests. The landing-page architecture animation is illustrative.

## Checks and build

Run from `frontend/`:

```sh
npm run typecheck
npm run lint
node --test tests/*.test.ts
npm run test:connections
npm run build
npm run preview
```

The TypeScript tests require a Node.js version with built-in TypeScript stripping, such as Node.js 22.18+ or Node.js 24. The browser regression test requires Chrome; `STARFLOW_BROWSER_BIN` can override its executable path. To exercise the native 3D renderer as well:

```sh
STARFLOW_BROWSER_WEBGL=1 npm run test:connections
```

Browser fixtures are confined to `frontend/tests`; production cards and counters come from the backend.

The build output is `frontend/dist`. Configure the static host to serve `index.html` for direct visits to `/setup` and `/dashboard`.

## Repository map

```text
frontend/
  src/components/landing/  Shared branding, Earth, galaxy, orbits, landing page
  src/mission/             Agent selection, dashboard, 3D station, connectors
  src/hooks/               Backend connection and snapshot lifecycle
  src/services/            API requests and snapshot validation
  tests/                   Contract, geometry, and browser regression tests
  public/                  Textures and visual assets
backend/
  main.py                  FastAPI routes and WebSocket stream
  scheduler.py             Agent queues and fair-share request release
  state.py                 Catalog, configuration, rates, and events
  gemini.py                Gemini prompts and response handling
  db.py                    Metrics storage and history queries
  sim.py                   Normal and rogue traffic generator
```

## Demo boundaries and troubleshooting

- **Catalog empty or HTTP 502:** check backend availability and the frontend's configured API address. A local backend does not replace the Railway connection automatically.
- **Rogue mode enabled but no flood:** run the simulator against the same backend as the dashboard.
- **Gemini error or timeout:** check the backend key, model access, and provider quota. Gemini calls have a 15-second timeout.
- **History unavailable:** verify database connectivity and run `db.setup()` for that database.
- **Backend restart:** the default lineup returns to chatbot/summarizer/tagger with shares 5/3/2. Active queues, counters, configuration, and events are in memory; stored database history persists separately.
- **Scope of protection:** the scheduler manages request admission within this process. It does not implement token budgeting or account for requests made outside StarFlow, and it does not guarantee Gemini latency or successful completion.
- **Deployment scope:** this is a shared hackathon demo with permissive CORS and unauthenticated configuration routes. A public production service would need authentication, stronger server-side configuration validation, and coordination across workers before running multiple backend processes.

For frontend-specific notes, see [frontend/README.md](frontend/README.md). Visual asset attribution and provenance are documented in [ASSET_NOTES.md](frontend/public/images/ASSET_NOTES.md) and the [texture README](frontend/public/textures/README.md).
