# StarFlow frontend

A React/Vite landing page for deterministic fair-share AI API scheduling.

## Development

```sh
npm install
npm run dev
```

The landing page is `/`. Every Launch Mission link points to `/dashboard`, which is intentionally a clearly labeled placeholder. For production hosting, configure the server to serve `index.html` for `/dashboard` as well as `/`.

```sh
npm run typecheck
npm run lint
npm run build
```

New landing components are TypeScript. The existing JSX entry point is retained. Tailwind v4 is configured through its Vite plugin alongside the site's CSS design tokens. Inter is loaded from Google Fonts, with Arial as its fallback.

## Pending: official Binary Orbits

**The mandatory galaxy is not installed.** `REACTBITS_LICENSE_KEY` was unavailable during implementation. `GalaxyBackground.tsx` deliberately reserves the background layer without substituting a different galaxy animation.

Registry URLs and shadcn aliases are configured in `components.json`. The Authorization headers still need configuration: the public React Bits installation page masks the header as `******`, so its exact format was not guessed.

1. Put the real key in `frontend/.env.local` as `REACTBITS_LICENSE_KEY`. This file is ignored by Git. Never use a `VITE_` prefix for the key.
2. Consult the authenticated official installation guide at https://pro.reactbits.dev/docs/installation and add the documented Authorization headers using an environment-variable reference, not a literal key.
3. From this directory, install:

   ```sh
   npx shadcn@latest add @reactbits-starter/binary-orbits-tw
   ```

4. Read the installed source and https://pro.reactbits.dev/docs/components/binary-orbits before integrating it in `src/components/landing/GalaxyBackground.tsx`.
5. Use the documented `interactive`, `hoverWake`, and `clickRipple` props to disable interaction. Use its documented `paused` prop for reduced motion, moderate `stars`, slow `speed`, pale blue/violet `colors`, and a tilted, right-offset composition. Verify prop names against the installed version.
6. Check mobile particle density, text contrast, animation performance, and the production build after installation.

The isolated background wrapper already sits behind content, ignores pointer events, and fades into the next section. It must remain independent of navigation state.

## Design

Dark navy surfaces, restrained pale blue accents, a single font family, and shared spacing and border styles connect every section. The architecture animation is explicitly illustrative; it does not display backend traffic or performance metrics. Reduced motion removes request particles and disables CSS motion and smooth scrolling.
