# hubshashwat Games 🎮

A collection of web games built for high performance and realism across mobile, tablet, and desktop devices.

## 🚀 Live on GitHub Pages
- **Games Portal**: `https://hubshashwat.github.io/games/`
- **Strike! 3D Bowling**: `https://hubshashwat.github.io/games/bowling/`

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
