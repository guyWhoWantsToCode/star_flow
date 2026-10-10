# StarFlow frontend

A React/Vite landing page for deterministic fair-share AI API scheduling.

## Development

```sh
npm install
npm run dev
```

The landing page is `/`. Launch Mission runs the shared travel transition to `/setup`. Choose 3–4 services from the full backend catalog, with Chatbot included. Get Started configures `/agents` with evenly divided request shares; `/dashboard` opens only after confirmation and a matching live scheduler snapshot. Direct dashboard visits connect immediately. Production hosting must serve `index.html` for `/setup` and `/dashboard`.

HTTP requests always use `https://starflow-production-7ca6.up.railway.app` and WebSockets always use `wss://starflow-production-7ca6.up.railway.app/ws` in development and production. Environment overrides and local proxy fallbacks are disabled. No backend process is started by this frontend. See [MISSION_INTEGRATION.md](./MISSION_INTEGRATION.md) for endpoint mappings and validation.

```sh
npm run typecheck
npm run lint
npm run build
```

New landing components are TypeScript. The existing JSX entry point is retained. Tailwind v4 is configured through its Vite plugin alongside the site's CSS design tokens. Inter is loaded from Google Fonts, with Arial as its fallback.

## Galaxy background

The entire site now uses a custom Canvas galaxy inspired by the supplied reference, following the request for a clockwise animation. It does not use the licensed React Bits Binary Orbits component.

The star texture is generated once per desktop/mobile size class. A slow clockwise rotation is projected into a tilted disc, with soft violet-blue arms and a luminous core. Rendering is limited to 60 fps on desktop (30 on mobile) and a maximum 2 pixel ratio. Mobile uses fewer stars. A fixed viewport layer keeps the same galaxy visible while scrolling through every section and on the dashboard. The clockwise speed is 0.075 radians per second, three times the original speed. A high-resolution texture, sharp star centers, and high-quality sampling preserve detail. Resize and intersection observers keep it responsive; tab visibility and reduced-motion preferences pause animation. No extra runtime dependency or license is required.

## Design

Dark navy surfaces, restrained pale blue accents, a single font family, and shared spacing and border styles connect every section. The architecture animation is explicitly illustrative; it does not display backend traffic or performance metrics. Reduced motion removes request particles and disables CSS motion and smooth scrolling.
