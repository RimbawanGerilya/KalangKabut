# Kalang Kabut

A low-poly walking prototype set in a haze-covered Indonesian roadside settlement.

**[Play in your browser](https://rimbawangerilya.github.io/KalangKabut/)**

Use a desktop browser with WebGL enabled. Click **Walk** to capture the mouse.

| Control | Action |
| --- | --- |
| WASD / arrow keys | Walk |
| Mouse | Look |
| Shift | Run |
| Space | Jump |
| Esc | Pause and release mouse |

The pause menu includes haze, rendering resolution, sound, and walking motion controls.

## Visual milestone 3

- Draw distance follows haze density: approximately 57 m at the default setting, 22 m at haze 100, and 12 m at haze 180.
- Static geometry is batched in local areas. Trees use instanced billboards; hidden foliage skips its facing updates.
- 505 plants, including 404 trees, plus cleaner low-resolution cutouts with preserved proportions.
- Cars have tapered bodies and sloped cabins. Trucks have shaped cabs, mirrors, and three axles.
- Small contact shadows, varied storefronts, roadside clutter, connected powerlines, and highway pileups.
- Rendering is capped at 60 frames per second while walking and 20 while paused; hidden tabs skip rendering.

This remains a walking prototype. Delivery missions, anomalies, and vehicles you can ride are planned for later.

## Run locally

The repository root is a static site. Serve it with any static HTTP server, then open its local URL. JavaScript modules require HTTP; opening index.html directly will not work. No npm build or CDN is required. Three.js is included locally under its MIT license in `assets/THREE-LICENSE.txt`.

The generated texture sheets contain fictional shop advertisements and candidate portraits.

## Validation

Offline browser checks passed for loading, movement, running, jumping and landing, pausing, collision boundaries, texture coverage, and vegetation/pole placement outside roads. Four fixed viewpoints were compared at three haze settings. The street view uses 271 draw calls at default haze, compared with 571 in the previous build, and 50 at maximum haze. These are rendering counts, not hardware frame-rate measurements. Richer vehicle geometry increases triangle count in the close pileup view.