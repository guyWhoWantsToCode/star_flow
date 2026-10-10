# Mission Control integration

The frontend uses the existing backend without modifying or starting it. Vite proxies `/api` HTTP requests and `/api/ws` WebSocket upgrades to the supplied `https://starflow-production-7ca6.up.railway.app` deployment. The service defaults to this public HTTPS address directly, deriving the secure WSS endpoint automatically. A Gemini key belongs exclusively on the backend.

| Interface | Existing backend contract |
| --- | --- |
| Scheduler snapshots | WebSocket `/ws`, validated before displaying live state; dynamic IDs/counts and optional display names are accepted |
| Agent metrics | `agents[].rate` for arrivals/releases/rejections per second; cumulative tried minus released minus rejected for current waiting |
| Request particles | Positive cumulative released deltas after the first snapshot; capped at six particles per agent per update |
| Rogue state | GET `/rogue`; POST `/rogue?on=true` or `false`, requiring confirmed state |
| Shares | POST `/shares?ids=chatbot,invoice&shares=5,3`, whole nonnegative values with sum at most the received limit |
| Prompt | GET `/ask?agent=…&text=…&real=true`, rendering the actual answer or backend error |
| Activity | `events` from scheduler snapshots; no invented client activity |

Launch Mission is a shared 3.1-second travel animation. Setup enables power only after selecting Chatbot, Summarizer, and Tagger. Activation takes 1.5 seconds and navigation requires a valid live snapshot. Neither selection nor activation starts or stops backend agents: the backend has no session lifecycle endpoint. Reduced motion shortens both transitions and removes moving request particles.

A scheduler release is permission to call Gemini, not confirmation that generation has completed. Response times measure the complete HTTP round trip. Rogue mode needs the backend's existing simulator to produce additional traffic. The frontend does not generate background traffic.

Disconnected and delayed states retain clearly marked stale values, disable mutations and prompt submission, and offer retry. Freshness is checked every 500 ms, delayed snapshots are marked after 2.5 seconds, and sockets with no response for seven seconds reconnect with bounded backoff. API requests have a 45-second timeout; a timeout does not prove the backend cancelled an accepted request.

For production, serve the SPA for `/`, `/setup`, and `/dashboard`. HTTP and WSS default to the public Railway deployment. The backend must allow the frontend origin through CORS. A different deployment can be selected with `VITE_STARFLOW_API_URL`; setting it to `/api` requires an HTTP/WebSocket reverse proxy.

Validation commands: `npm run typecheck`, `npm run lint`, `npm run build`, and `node --test tests/starflow.test.ts`. Contract tests use test-only inputs and never populate application data.
