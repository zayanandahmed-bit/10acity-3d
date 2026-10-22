# 10ACITY — 3D preview

Preview build of https://design.harvest.pk/ with a 3D layer added on top. The original page content is unchanged; everything new lives in `fx3d/`:

- `fx3d/fx.js` — Three.js WebGL backdrop (particle wave field, hero glass core with orbit rings, depth dust), 3D card tilt with glare, 3D scroll reveals, magnetic buttons, custom cursor.
- `fx3d/fx.css` — styles for the above.

The only edits to `index.html` are one `<link>` to `fx3d/fx.css` and one `<script type="module">` for `fx3d/fx.js`.
Respects `prefers-reduced-motion`; tilt and cursor are off on touch devices.
