# Strike! 3D • Realistic hubshashwat Bowling Game

A photorealistic, fully-featured 3D bowling simulation built with **hubshashwat**, **Cannon-es physics**, and **Web Audio API**. Designed and optimized to run on **phones, tablets, and laptops/desktops**.

---

## 🎳 Features

### 1. Visual Realism (hubshashwat PBR Rendering)
- **Authentic Regulation Lane**: Modeled to official USBC dimensions (60 ft foul line to headpin, 41.5-inch width, 39 individual maple wood boards, approach dots, 7 targeting chevron arrows at 15 ft, and pin deck spots).
- **Brunswick Regulation Pins**: Precision LatheGeometry curved silhouette with glossy lacquer finish, dual red neck stripes, and crown emblem.
- **5 Custom Bowling Balls**:
  - *Inferno Firestorm* (Fiery red/orange marble, 15 lbs)
  - *Cosmic Nebula* (Deep violet & magenta pearl with star flecks, 14 lbs)
  - *Toxic Emerald* (Electric green & turquoise swirl, 14 lbs)
  - *Carbon Stealth* (Matte satin black with crimson ring, 16 lbs)
  - *Royal Gold* (Metallic gold flake luxury ball, 12 lbs)
  - Modeled with 3 realistic finger holes that roll and tumble along the lane.
- **Bowling Lounge Atmosphere**: Slatted acoustic wood walls, recessed ceiling beams, dramatic pin deck spotlights with soft shadows, neon runner strips, and overhead TV score displays.
- **Mechanical Pinsetter**: Functional rake/sweep arm that lowers and sweeps knocked-down pins into the pit between rolls, then lowers fresh pins.
- **Dynamic Multi-Angle Cameras**:
  - `FOLLOW`: Dynamic trailing camera following the ball down the alley into the pins.
  - `AIM`: Authentic bowler view from the approach deck.
  - `PIN`: Reverse action view from the pin deck looking back at the incoming ball.
  - `OVERHEAD`: Bird's-eye tactical view down the alley.

### 2. Physical Realism & Hook Physics (Cannon-es)
- **Realistic Pin Dynamics**: Pins modeled as compound collision shapes with an authentic low center-of-gravity (~35% from base) for natural wobbling and domino chain reactions.
- **True Oil Patterns & Hook Curve**:
  - Simulates differential lane friction between oiled heads/midlane and dry backend boards.
  - Lateral spin (RPM) grips the dry backends, producing an authentic professional hook curve into the 1-3 pocket.
- **Sub-stepping & Anti-Tunneling**: Physics stepped at sub-step intervals (1/180s) to guarantee zero tunneling even at high ball speeds (>25 mph).

### 3. Three Difficulty Modes
- **🟢 EASY (Recreational)**:
  - Retractable bumper rails raised (zero gutter balls!).
  - Full-length green trajectory prediction guideline.
  - High pin scatter multiplier and forgiving pocket carry.
- **🔵 MEDIUM (Standard League)**:
  - Open gutters, no bumpers.
  - Short aiming arrow guide (extends to target arrows at 15 ft).
  - Authentic USBC House oil pattern (slick center boards, dry outside boards).
- **🔴 HARD (PBA Sport Tour)**:
  - Flat 3:1 Sport oil pattern.
  - Zero aim guideline (spot-bowling only).
  - Strict pocket entry angle required; light or high hits leave stubborn splits like 7-10 or 4-6-7-10!

### 4. Official USBC 10-Frame Scoring Engine
- Full regulation rules:
  - Frames 1 to 9: 2 rolls per frame (strikes advance immediately).
  - Frame 10: up to 3 rolls for strikes or spares.
  - Maximum possible score = 300 (12 consecutive strikes).
- Electronic score sheet with real-time running totals, strikes (`X`), spares (`/`), gutter balls (`-`), and circled splits.
- Miniature 10-pin triangle HUD showing live standing and knocked-down pins.

### 5. Multi-Device Controls
- **📱 Phone & Tablet (Touch)**:
  - Drag on approach to adjust stance.
  - Flick/swipe up forward to roll (swipe speed controls velocity, angle controls direction).
  - Hook Spin slider to dial in curve.
  - One-tap "ROLL BALL" button.
- **💻 Laptop & Desktop (Mouse & Keyboard)**:
  - `[A / D]` or `[← / →]` : Adjust stance left/right.
  - `[Q / E]` : Adjust left/right hook spin.
  - `[Space]` or `[Enter]` : Roll ball.
  - Click & drag on canvas to fling, or click "ROLL BALL".

### 6. Storage & Offline Sound
- **Browser & Cookie Storage**: Persists high scores for all 3 difficulties, total games, total strikes, total spares, average score, and match history (last 15 games). Uses `localStorage` with automatic fallback to `document.cookie`.
- **Procedural Web Audio API Engine**: 100% self-contained audio generated via synthesis (no external audio files to fail or get blocked):
  - Resonant rolling rumble tied to ball velocity.
  - Dynamic wooden pin clatter and secondary pin collisions.
  - Gutter drop thud & bumper spring bounce.
  - Strike fanfare + crowd cheering & spare melodic jingle.
  - Pinsetter motor and sweep arm sounds.

---

## 🚀 Quick Start

### Development
```bash
npm install
npm run dev
```
Open `http://localhost:3000/` in your browser.

### Build Production Bundle
```bash
npm run build
npm run preview
```

### Run Tests
```bash
# Run rules & scoring unit tests (48 tests)
npm test

# Run End-to-End browser tests (Headless Chromium)
node tests/e2e.test.js
```
