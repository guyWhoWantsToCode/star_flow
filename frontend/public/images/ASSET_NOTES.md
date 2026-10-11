# Mission Control assets

## Live 3D station

The Mission Control station now renders real geometry with Three.js: a bevelled titanium outer ring, counter-rotating calibration ring, clear-coated rotating core, equatorial docking mechanism, and two rotating sensor masts. All labels and live connection paths remain HTML/SVG. A transparent still exported from this current renderer (`mission-station-current.png`) is the fallback when WebGL, shaders or the texture are unavailable. The original generated station image is retained as an unused source asset. The shared landing-page galaxy and Earth backgrounds are unchanged.

- `mission-station-current.png` is a transparent 862 × 1009 PNG canvas export of `src/mission/stationScene.ts`, with its existing generated metal texture, captured at retina resolution by the isolated native-WebGL browser regression runner. It contains no baked-in text or backend data.
- The renderer starts in an explicit loading state, reserves its dimensions, and reveals the model only after its first complete frame. The fallback is requested only on renderer failure, preventing the previous image from flashing during initialization.

- New asset: `frontend/public/images/station-metal-v2.jpg`, 2172 × 724, JPEG quality 90. Used as the metal color and subtle bump map.
- Generation mode: built-in image-generation tool; no API/CLI fallback.
- Original generated file: `/Users/nihar/.codex/generated_images/01a12753-77dc-7e60-aca3-3dc8618b19fd/exec-1b7be9b9-d80b-43ae-bf81-6194355ff672.png`.
- The native renderer loads only on Mission Control, limits device resolution, pauses offscreen/when hidden, and respects reduced motion.

### Metal surface prompt

Use case: product-mockup. Asset type: realistic metal surface texture for a live 3D orbital station's rotating mechanical rings in a StarFlow web dashboard. Generate a single wide 3:1 rectangular full-bleed texture atlas, approximately 1536 x 512 or higher. This is a FLAT material/albedo surface, front-on orthographic with no perspective, not an illustration of a space station. Brushed dark titanium and cool silver aerospace panels: a repeating sequence of 12 finely engineered rectangular panels, hairline grooves, inset narrow vents, subtle milled machining marks, tiny recessed fasteners, charcoal gasket seams, restrained natural weathering and varied roughness. Top and bottom edges have narrow continuous brushed-silver trim strips; across middle some panels have slender inset blue-cyan luminous indicator slots, sparse and restrained. High fidelity realistic film prop material, sharp detailed texture, convincing hand-designed hardware. Neutral soft diffuse illumination, no deep cast shadows, no intense specular highlights baked in. Seamless left/right boundary, full rectangular coverage with no background and no empty margins. No text, no logos, no UI, no rings pictured, no stars, no emissive bloom, no watermark.


Generated with the built-in image generation tool, then copied into this project. The station retains its transparent alpha channel. The backdrop was encoded as JPEG with macOS sips at quality 88. All dashboard labels and live values are rendered by the frontend, not baked into these images.

- `mission-station.png`: transparent station, 1159 × 1357.
- `mission-cosmos.jpg`: static deep-space background.

## Station prompt

Create a single high quality photorealistic 3D CGI sci-fi orbital API station asset for a web dashboard. Transparent background, isolated object, no backdrop, no stars, no text, no labels, no logos, no cables extending out. Composition centered and front-on, complete structure fits with 5% transparent margin. Tall elegant antenna mast above and below, massive circular vertical metallic outer ring, central deep navy glossy glass orb with faint longitude/latitude grid, and thick mechanical horizontal equatorial docking ring wrapping the sphere in perspective. The orb has cyan light at upper left, cool violet rim at upper right, and electric blue light below. Metal rings have realistic machined titanium panels, bolts, greebles, vents, small cyan LED strips, seams, docking clamps and fine engineering details. High fidelity premium science-fiction movie prop, dark gunmetal and silver surfaces, crisp restrained emissive lighting rather than cartoon neon, polished dimensional reflections. Sphere centered at 50% horizontal and 47% vertical, equatorial front band at about 60% height, band center left blank and dark so real HTML text can be overlaid later. Structure width 80% of image and height 94%. Ring occupies approximately y20% through y82%, sphere y31% through y68%. No lettering whatsoever. Transparent alpha.

## Background prompt

A premium realistic deep-space background plate for a dark Mission Control web interface, wide landscape 16:9 composition. Extremely dark navy-black cosmic canvas, naturally scattered tiny crisp blue-white stars with varied brightness and density, sparse brighter stars, soft very faint indigo and midnight-blue Milky Way wisps around the outer left and right edges. Center stays dark and open to show a bright mechanical space station over it. Subtle cyan dust at the lower left and cool violet-blue haze in the lower right. Real astrophotography feeling, restrained atmospheric depth, no planets, no Earth, no spacecraft, no ring station, no text, no symbols, no UI. Avoid large white nebula, avoid saturated broad blobs, no lens flares. A seamless quiet backdrop, high detail, high quality, low overall brightness.
