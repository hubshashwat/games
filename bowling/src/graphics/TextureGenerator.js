import * as THREE from 'three';
import { DIMENSIONS } from '../config.js';

/**
 * Procedural Texture Generator
 * Creates realistic, high-fidelity procedural textures using HTML5 Canvas.
 */
export class TextureGenerator {
  /**
   * Generates realistic wood plank bowling lane texture.
   * Includes: 39 individual maple boards, foul line, approach dots, 7 lane targeting arrows, pin deck spots.
   */
  static createLaneTexture() {
    const width = 1024;
    const height = 4096;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // Ratio breakdown:
    // Z runs from +APPROACH_LENGTH down to -LANE_LENGTH - PIN_DECK_LENGTH
    // Total physical length = 4.5 + 18.288 + 0.95 = 23.738m
    // Let Y=0 on canvas be Approach start (Z = +4.5), and Y=height be Back of Pin Deck (Z = -19.238)
    const totalLength = DIMENSIONS.APPROACH_LENGTH + DIMENSIONS.LANE_LENGTH + DIMENSIONS.PIN_DECK_LENGTH;
    const approachRatio = DIMENSIONS.APPROACH_LENGTH / totalLength;
    const laneRatio = DIMENSIONS.LANE_LENGTH / totalLength;

    const foulLineY = height * approachRatio;
    const arrowsY = foulLineY + height * (4.572 / totalLength); // 15 ft past foul line
    const dotsY = foulLineY + height * (2.134 / totalLength);   // 7 ft past foul line
    const pinDeckY = foulLineY + height * (DIMENSIONS.LANE_LENGTH / totalLength);

    // 1. Draw 39 regulation maple wood boards
    const numBoards = 39;
    const boardWidth = width / numBoards;

    // Palette of natural blonde maple plank tones
    const baseColors = [
      '#f3deba', '#eed6b0', '#f7e4c5', '#e9ce9f', '#f9e7cd',
      '#ebd1a8', '#f2dcb6', '#ead0a6', '#f6e2c2', '#e8cca1'
    ];

    for (let i = 0; i < numBoards; i++) {
      const bx = i * boardWidth;
      const color = baseColors[i % baseColors.length];
      ctx.fillStyle = color;
      ctx.fillRect(bx, 0, boardWidth + 0.5, height);

      // Add subtle wood grain lines along plank
      ctx.fillStyle = 'rgba(120, 85, 45, 0.04)';
      for (let g = 0; g < 4; g++) {
        const gx = bx + (g + 0.5) * (boardWidth / 4);
        ctx.fillRect(gx, 0, 1, height);
      }

      // Plank separator seam
      ctx.fillStyle = 'rgba(70, 45, 20, 0.18)';
      ctx.fillRect(bx, 0, 1, height);
    }

    // Pin deck section (hard maple / synthetics with lighter shade)
    ctx.fillStyle = 'rgba(255, 255, 245, 0.08)';
    ctx.fillRect(0, pinDeckY, width, height - pinDeckY);

    // Pin deck border line
    ctx.fillStyle = 'rgba(60, 40, 20, 0.4)';
    ctx.fillRect(0, pinDeckY, width, 3);

    // 2. Foul Line (1-inch solid black/dark brown band across lane)
    ctx.fillStyle = '#1a0d00';
    ctx.fillRect(0, foulLineY - 4, width, 8);

    // 3. Lane Guide Dots (7 ft past foul line)
    // Placed on boards 3, 5, 8, 11, 14, 20 (center), 26, 29, 32, 35, 37
    const dotBoards = [3, 5, 8, 11, 14, 20, 26, 29, 32, 35, 37];
    ctx.fillStyle = '#221105';
    dotBoards.forEach(b => {
      const cx = (b - 0.5) * boardWidth;
      ctx.beginPath();
      ctx.arc(cx, dotsY, boardWidth * 0.28, 0, Math.PI * 2);
      ctx.fill();
    });

    // 4. Approach Guide Dots (Before foul line, at 12 ft and 15 ft)
    const approachDots1Y = foulLineY - height * (3.65 / totalLength);
    const approachDots2Y = foulLineY - height * (4.25 / totalLength);
    [approachDots1Y, approachDots2Y].forEach(y => {
      if (y > 0) {
        dotBoards.forEach(b => {
          const cx = (b - 0.5) * boardWidth;
          ctx.beginPath();
          ctx.arc(cx, y, boardWidth * 0.26, 0, Math.PI * 2);
          ctx.fill();
        });
      }
    });

    // 5. Targeting Arrows (7 chevron arrows at 15 ft past foul line)
    // Positioned on boards 5, 10, 15, 20, 25, 30, 35
    // Staggered in distance: Center arrow (20) is farthest down lane (~16 ft), others form a chevron
    const arrowBoards = [
      { board: 5,  stagger: 0.8 },
      { board: 10, stagger: 0.9 },
      { board: 15, stagger: 1.0 },
      { board: 20, stagger: 1.15 }, // Tip of pyramid
      { board: 25, stagger: 1.0 },
      { board: 30, stagger: 0.9 },
      { board: 35, stagger: 0.8 }
    ];

    ctx.fillStyle = '#2b1406';
    arrowBoards.forEach(({ board, stagger }) => {
      const cx = (board - 0.5) * boardWidth;
      const cy = arrowsY + (stagger - 1.0) * (height * 0.025);
      const aw = boardWidth * 0.75;
      const ah = height * 0.014;

      // Draw downward-pointing chevron arrow
      ctx.beginPath();
      ctx.moveTo(cx, cy + ah);
      ctx.lineTo(cx + aw, cy - ah * 0.3);
      ctx.lineTo(cx, cy);
      ctx.lineTo(cx - aw, cy - ah * 0.3);
      ctx.closePath();
      ctx.fill();
    });

    // 6. Pin spots on pin deck (10 small circles)
    const pinSpotCanvasCoords = [
      { x: width * 0.5, y: pinDeckY + height * 0.005 },
      { x: width * 0.36, y: pinDeckY + height * 0.015 },
      { x: width * 0.64, y: pinDeckY + height * 0.015 },
      { x: width * 0.22, y: pinDeckY + height * 0.025 },
      { x: width * 0.5,  y: pinDeckY + height * 0.025 },
      { x: width * 0.78, y: pinDeckY + height * 0.025 },
      { x: width * 0.08, y: pinDeckY + height * 0.035 },
      { x: width * 0.36, y: pinDeckY + height * 0.035 },
      { x: width * 0.64, y: pinDeckY + height * 0.035 },
      { x: width * 0.92, y: pinDeckY + height * 0.035 }
    ];

    ctx.fillStyle = 'rgba(40, 20, 10, 0.45)';
    pinSpotCanvasCoords.forEach(pt => {
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, boardWidth * 0.35, 0, Math.PI * 2);
      ctx.fill();
    });

    // Subtle gloss sheen gradient along lane
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 16;
    return texture;
  }

  /**
   * Generates roughness map for the lane
   * Center boards are slicker (heavier oil), edges are drier (rougher)
   */
  static createLaneRoughnessMap() {
    const width = 512;
    const height = 1024;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // Base roughness
    ctx.fillStyle = '#444444';
    ctx.fillRect(0, 0, width, height);

    // Oiled center channel (smoother = darker grey)
    const oilGrad = ctx.createLinearGradient(0, 0, width, 0);
    oilGrad.addColorStop(0, '#555555');   // Edges drier
    oilGrad.addColorStop(0.2, '#222222'); // Heavy oil zone
    oilGrad.addColorStop(0.5, '#181818'); // Center slickest
    oilGrad.addColorStop(0.8, '#222222');
    oilGrad.addColorStop(1, '#555555');

    ctx.fillStyle = oilGrad;
    // Oiled heads and midlane (first 65% of lane past foul line)
    ctx.fillRect(0, 200, width, 550);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
  }

  /**
   * Generates Brunswick regulation bowling pin texture:
   * Pristine glossy white body, 2 official red neck rings, and crown logo on the belly.
   */
  static createPinTexture() {
    const width = 512;
    const height = 512;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // Pure white glossy base
    ctx.fillStyle = '#fafaff';
    ctx.fillRect(0, 0, width, height);

    // Subtle vertical surface sheen
    const sheen = ctx.createLinearGradient(0, 0, width, 0);
    sheen.addColorStop(0, 'rgba(235, 238, 245, 0.4)');
    sheen.addColorStop(0.5, 'rgba(255, 255, 255, 0.8)');
    sheen.addColorStop(1, 'rgba(235, 238, 245, 0.4)');
    ctx.fillStyle = sheen;
    ctx.fillRect(0, 0, width, height);

    // Official USBC Red Neck Stripes
    // Y runs from bottom of pin (0) to top (height)
    // The neck is roughly around 68% to 78% of the height
    const bandHeight = height * 0.038;
    const bandSpacing = height * 0.024;
    const neckY = height * 0.72;

    ctx.fillStyle = '#dc2626'; // Vivid red
    // Top stripe
    ctx.fillRect(0, neckY - bandHeight - bandSpacing * 0.5, width, bandHeight);
    // Bottom stripe
    ctx.fillRect(0, neckY + bandSpacing * 0.5, width, bandHeight);

    // Brunswick style crown / diamond emblem on front of belly (center X: width * 0.5, Y: height * 0.42)
    const cx = width * 0.5;
    const cy = height * 0.42;
    const rw = width * 0.12;
    const rh = height * 0.07;

    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.moveTo(cx, cy - rh);
    ctx.lineTo(cx + rw, cy);
    ctx.lineTo(cx, cy + rh);
    ctx.lineTo(cx - rw, cy);
    ctx.closePath();
    ctx.fill();

    // Inner gold crown
    ctx.fillStyle = '#ffd166';
    ctx.beginPath();
    ctx.arc(cx, cy, rw * 0.4, 0, Math.PI * 2);
    ctx.fill();

    // Base bottom rim rubber bumper ring (subtle grey/brown base)
    ctx.fillStyle = '#c5c8d0';
    ctx.fillRect(0, 0, width, height * 0.03);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    return texture;
  }

  /**
   * Generates custom marbled bowling ball texture with visible 3 finger holes
   */
  static createBallTexture(ballPreset) {
    const width = 1024;
    const height = 512;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // Base coat
    ctx.fillStyle = ballPreset.primaryColor;
    ctx.fillRect(0, 0, width, height);

    // Procedural marble swirling bands
    const numSwirls = 18;
    for (let i = 0; i < numSwirls; i++) {
      const grad = ctx.createLinearGradient(
        Math.random() * width, Math.random() * height,
        Math.random() * width, Math.random() * height
      );
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(0.3, ballPreset.secondaryColor);
      grad.addColorStop(0.7, ballPreset.swirlColor);
      grad.addColorStop(1, 'rgba(0,0,0,0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      const startX = Math.random() * width;
      const startY = Math.random() * height;
      ctx.moveTo(startX, startY);

      // Bezier curve swirl
      ctx.bezierCurveTo(
        Math.random() * width, Math.random() * height,
        Math.random() * width, Math.random() * height,
        Math.random() * width, Math.random() * height
      );
      ctx.lineWidth = 40 + Math.random() * 80;
      ctx.stroke();
    }

    // Sparkle pearl specks
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    for (let s = 0; s < 250; s++) {
      const sx = Math.random() * width;
      const sy = Math.random() * height;
      const sr = 0.8 + Math.random() * 2.2;
      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3 Finger Holes (Thumb hole + Middle finger + Ring finger)
    // Mapped on equator of sphere
    const holeColor = '#0d0d0d';
    const holeInnerColor = '#000000';
    const hx = width * 0.35;
    const hy = height * 0.5;

    // Thumb hole
    const thumbRadius = 18;
    ctx.fillStyle = holeColor;
    ctx.beginPath();
    ctx.arc(hx, hy + 38, thumbRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = holeInnerColor;
    ctx.beginPath();
    ctx.arc(hx, hy + 38, thumbRadius * 0.8, 0, Math.PI * 2);
    ctx.fill();

    // Finger holes (two side-by-side above thumb)
    const fingerRadius = 13;
    // Left finger
    ctx.fillStyle = holeColor;
    ctx.beginPath();
    ctx.arc(hx - 22, hy - 26, fingerRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = holeInnerColor;
    ctx.beginPath();
    ctx.arc(hx - 22, hy - 26, fingerRadius * 0.8, 0, Math.PI * 2);
    ctx.fill();

    // Right finger
    ctx.fillStyle = holeColor;
    ctx.beginPath();
    ctx.arc(hx + 22, hy - 26, fingerRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = holeInnerColor;
    ctx.beginPath();
    ctx.arc(hx + 22, hy - 26, fingerRadius * 0.8, 0, Math.PI * 2);
    ctx.fill();

    // Brand logo stamping on opposite side
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(ballPreset.name.toUpperCase().split(' ')[0], width * 0.85, height * 0.5);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    return texture;
  }

  /**
   * Generates Gutter texture (dark textured composite)
   */
  static createGutterTexture() {
    const width = 256;
    const height = 512;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#1c1c1f';
    ctx.fillRect(0, 0, width, height);

    // Subtle noise and vertical streaks
    ctx.fillStyle = 'rgba(40, 42, 48, 0.5)';
    for (let i = 0; i < 20; i++) {
      ctx.fillRect(i * 13, 0, 4, height);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 10);
    return texture;
  }
}
