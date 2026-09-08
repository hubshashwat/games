# hubshashwat Games 🎮

A collection of web games built for high performance and realism across mobile, tablet, and desktop devices.

## 🚀 Live on GitHub Pages
- **Games Portal**: `https://hubshashwat.github.io/games/`
- **Cat & Snake: Jungle Escape**: `https://hubshashwat.github.io/games/cat-and-snake/`
- **Strike! 3D Bowling**: `https://hubshashwat.github.io/games/bowling/`

---

## 🐆 Cat & Snake: Endless Jungle Escape (`/cat-and-snake`)
An ultra-realistic 3D endless rainforest runner built with **Three.js** and **Web Audio API**. Flee as an agile cat through the jungle with a terrifying 45-segment giant serpent breathing down your neck!

### Highlights
- **Quadruped Cat Realism**:
  - Authentic 4-beat rotary gallop stride animation with spine flex and bobbing ears.
  - Multi-segment procedural spring/verlet physics tail.
  - 4 customizable feline pelts (Jungle Leopard, Midnight Panther, Bengal Tiger, Clouded Spirit).
  - Agile controls: Lane dodging (`A`/`D` or swipe), high leap over logs (`Space`/`W`), low crouch slide under stone arches and creepers (`S`/`Down`).
- **Terrifying Giant Serpent**:
  - 45 articulated vertebrae segments conforming to the cat's running trail.
  - Emerald and charcoal diamond scale PBR textures with iridescent sheen.
  - Sinusoidal lateral undulation wave matching running velocity.
  - Hinged jaw opening to expose curved venomous fangs, glowing slit reptilian eyes, and flicking bifurcated tongue when lunging.
  - Dynamic proximity danger system with screen-space vignette alert and tension heartbeat audio.
- **Endless Procedural Rainforest**:
  - Continuous chunk streaming with ancient Kapok trees, sprawling buttress roots, hanging lianas, ferns, and mossy fallen logs.
  - Directional tropical sunlight with soft PCF shadows, canopy mist fog, and volumetric God rays.
  - Dynamic particle system: sun dust motes, fireflies, paw dirt puffs, and boost sparks.
- **100% Procedural Web Audio**:
  - Synthetic gallop footsteps, spatial snake hisses, acceleration heartbeats, and ambient jungle soundscape (cicadas, wind, birds) with zero external asset dependencies.
- **Tested Across Every Screen**:
  - Adaptive vertical FOV (56°–85°) ensuring zero cropping on narrow mobile portrait phones, tablets, and 21:9 ultra-wide monitors.
  - Native touch swipe gestures + ergonomic on-screen thumb buttons (Jump, Slide, Sprint, Pause).

---

## 🎳 Strike! 3D Bowling (`/bowling`)
A photorealistic 3D bowling simulation built with **hubshashwat**, **Cannon-es physics**, and **Web Audio API**.

### Highlights
- **Realistic 3D Physics**:
  - Full pin-to-pin and ball-to-pin collision dynamics with authentic pin restitution.
  - True oil pattern friction modeling that grips hook spin for pocket curve shots.
- **3 Difficulty Levels**:
  - 🟢 **Easy**: Retractable bumpers raised, 60-ft trajectory guide, bouncy pin domino scatter.
  - 🔵 **Medium**: Regulation USBC House oil pattern, 15-ft targeting arrow guide.
  - 🔴 **Hard**: Flat 3:1 PBA Sport oil pattern, zero aim guide, deadened bounce leaving tough splits on off-pocket hits.
- **Official USBC Scoring**:
  - 10 full frames with strikes, spares, 10th frame bonus rolls, real-time running totals, and personal best tracking per difficulty level.
- **Multi-Device Input**:
  - 📱 Touch/mobile: Swipe to throw, drag to set stance, hook slider.
  - 💻 Desktop: Mouse flick, keyboard controls (`A`/`D` to position, `Q`/`E` for hook, `Space` to roll).
- **Persistent Storage**:
  - High scores, average score, strikes, and recent match history stored via `localStorage` with cookie fallback.

### Development & Build
To run the bowling game locally:
```bash
cd bowling
npm install
npm run dev
```

To build production bundle:
```bash
npm run build
```
