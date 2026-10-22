# 10ACITY — 3D journey preview

Preview build of https://design.harvest.pk/ turned into a scroll-driven 3D journey. The site's own sections, text, images, form and links are unchanged; everything new lives in `fx3d/`, and the only edits to `index.html` are one `<link>` and one `<script type="module">` tag.

## What it does

- **Fly through the site.** Each section is a panel floating in a 3D world. Scrolling flies a camera from one to the next; when you arrive, the panel faces you at normal size so it reads and works exactly like the original (tall sections pan normally).
- **Content assembles as you approach.** Headings, cards and widgets start scattered in depth and converge into place as each panel arrives.
- **A world for every stop.** Hero: a morphing glass core with orbit rings. How It Works: four light gates you fly through, then nodes behind each stage badge linked by a travelling pulse. Services: a glowing network behind the service icons. Is this you?: a pulse running down the numbered list. Testimonials: a ring of stars. Contact: a pipeline of light you ride into the form. FAQ: floating wire forms. Final call: a portal of light around the CTA.
- **Navigation.** The site header stays on top. A chapter menu on the right (desktop) flies to any section, and the header's About Us and Services links fly there too. Stopping mid-flight finishes the trip automatically.
- **Interaction.** Intro fly-in with a loader, mouse parallax, cards that tilt with glare, magnetic buttons and a custom cursor.

## Fallbacks

- `?classic` shows the original page with only the hover effects.
- Visitors with *reduce motion* switched on get the classic page automatically.
- If the 3D layer can't start (no WebGL, script blocked), the normal page appears.

## Files

- `fx3d/fx.js` — the journey: DOM staging, camera path, CSS 3D projection (same maths as three.js CSS3DRenderer), WebGL world, snapping, chapter menu.
- `fx3d/fx.css` — stage, loader, chapter menu, hint, tilt and cursor styles.
