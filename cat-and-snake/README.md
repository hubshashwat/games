# Cat and Snake: Endless Jungle Escape 🐆🐍

An ultra-realistic 3D endless runner built with **Three.js**, **Web Audio API**, and modern responsive web design. 

You are an agile feline galloping through a lush, atmospheric rainforest. Just meters behind you slithers a massive, terrifying prehistoric serpent. As long as you keep running, you keep accumulating points and meters. Jump over fallen mossy logs, duck beneath ancient ruin arches and hanging lianas, dodge dense brambles, avoid mud quagmires, and grab luminous Star Orchids and Ancient Relics!

---

## 🎮 Play Live
- **Portal**: [hubshashwat.github.io/games/](https://hubshashwat.github.io/games/)
- **Direct Link**: [hubshashwat.github.io/games/cat-and-snake/](https://hubshashwat.github.io/games/cat-and-snake/)

---

## ✨ Features & Realism Highlights

### 🐆 Anatomical Quadruped Cat
- **Authentic 4-Beat Rotary Gallop Animation**: Dynamic spine flexion and extension, bobbing feline cranium, tilting triangular ears, and paw dirt kickup particles.
- **Procedural Spring/Verlet Physics Tail**: 7-segment chain swaying and curving with movement inertia and centrifugal bank angles.
- **4 Custom Feline Pelts**:
  - 🐆 **Jungle Leopard**: Golden amber coat with dark rosettes.
  - 🐈‍⬛ **Midnight Panther**: Sleek obsidian coat with piercing emerald eyes.
  - 🐅 **Bengal Tiger**: Fiery orange with bold predatory stripes.
  - ❄️ **Clouded Spirit**: Silvery mist pelt with glowing turquoise eyes.
- **Agile Movement**:
  - Smooth lane dodging (`-1`, `0`, `+1`) with natural banking lean.
  - Powerful leap to clear fallen mossy timber.
  - Low crouch slide to duck under low arches and hanging vines.

### 🐍 The Giant Prehistoric Jungle Serpent
- **45 Articulated Vertebrae Segments**: Spline-based kinematic tracking that follows the cat's path.
- **Anatomical Serpentine Tapering**: Muscular hood and thick midsection (diameter ~0.75m) tapering down to a whip-like tail tip.
- **Procedural Diamond Scale Shaders**: Emerald green and charcoal scales with iridescent specular sheen and belly ventral scutes.
- **Traveling S-Wave Undulation**: Realistic sinusoidal lateral undulation matching running speed.
- **Predatory Behavior**:
  - Glowing reptilian eyes that burn brighter when lunging.
  - Hinged lower jaw that drops open wide to reveal needle-sharp fangs when closing in.
  - Rapidly flickering bifurcated forked tongue.
  - Dynamic distance: trips and mud obstacles cause the serpent to surge forward aggressively!

### 🌿 Endless Procedural Rainforest
- Towering Kapok & Banyan trees with sprawling buttress roots and hanging lianas.
- Dense undergrowth: tropical ferns, monsteras, and damp jungle earth.
- Real-time PCF soft shadows, atmospheric canopy fog, and volumetric sunbeams (God Rays).
- Dynamic particle system: drifting sun dust motes, glowing emerald fireflies, paw dirt puffs, and boost sparks.
- Continuous chunk recycling for smooth 60+ FPS performance without memory leaks.

### 🔊 100% Procedural Web Audio Engine
- Zero external MP3/WAV dependencies — runs offline with zero latency and zero asset loading failures.
- Rhythmic quadruped gallop footsteps (muffled earth thud + dry leaf rustle).
- Terrifying 3D spatial snake hiss and slithering dry leaf textures.
- Tension Heartbeat: accelerates and gains deep resonant bass when the serpent enters striking range (< 4m).
- Generative ambient jungle soundscape (cicadas, crickets, canopy breeze).
- Audio mute toggle and persistent settings.

### 📱 Responsive Across Every Screen
- **Aspect-Ratio Adaptive Field of View (FOV)**: Automatically scales vertical FOV from 56° to 85° so narrow mobile screens (e.g. iPhone portrait) never crop side lanes or the pursuing serpent.
- **Multi-Device Input**:
  - 💻 **Desktop / Keyboard**: `A` / `D` or Arrow Keys to steer, `Space` / `W` / `Up` to jump, `S` / `Down` to slide, `Shift` to sprint, `P` / `Esc` to pause.
  - 📱 **Mobile Touch Gestures**: 4-way swipe detection (Swipe Up = Jump, Swipe Down = Slide, Swipe Left/Right = Switch Lanes).
  - 🔘 **On-Screen Touch Buttons**: Thumb-friendly Jump, Slide, Sprint, and Pause buttons for portrait and landscape phones/tablets.
- Tested across iPhone portrait, iPhone landscape, iPad Air, iPad Pro, 1080p desktop, and 21:9 ultra-wide monitors.

---

## 🛠️ Development & Testing

### Installation
```bash
cd cat-and-snake
npm install
```

### Local Dev Server
```bash
npm run dev
```

### Production Build
```bash
npm run build
```

### Run Unit Tests
```bash
npm run test
```

### Run Automated Multi-Device E2E Tests (Headless Brave/Puppeteer)
```bash
npm run test:e2e
```

### Capture Screenshots
```bash
npm run screenshots
```

---

## 📄 License
MIT License • Created by hubshashwat
