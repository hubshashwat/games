/**
 * Game Configuration & Bowling Regulations
 * Real-world dimensional metrics scaled 1:1 in meters.
 */

export const DIMENSIONS = {
  // Lane specs
  LANE_LENGTH: 18.288, // 60 ft from foul line to headpin
  LANE_WIDTH: 1.054,   // 41.5 inches regulation width
  APPROACH_LENGTH: 4.5, // 15 ft approach deck before foul line
  PIN_DECK_LENGTH: 0.95,
  PIT_DEPTH: 0.9,     // Back ball/pin pit behind deck
  GUTTER_WIDTH: 0.235,// 9.25 inches
  GUTTER_DEPTH: 0.05, // 2 inches sunken channel
  BUMPER_RADIUS: 0.045,
  BUMPER_HEIGHT: 0.065,

  // Ball specs
  BALL_RADIUS: 0.108,  // 8.5 inch diameter
  DEFAULT_BALL_MASS: 6.35, // 14 lbs in kg (approx)

  // Pin specs
  PIN_HEIGHT: 0.381,  // 15 inches
  PIN_RADIUS_BASE: 0.0285,
  PIN_RADIUS_BELLY: 0.0605, // 4.75 inch diameter
  PIN_RADIUS_NECK: 0.025,
  PIN_RADIUS_HEAD: 0.038,
  PIN_MASS: 1.58,     // 3 lbs 8 oz (~1.58 kg)
  PIN_DISTANCE: 0.3048 // 12 inches center-to-center
};

// Coordinate system:
// +X: Right, -X: Left
// +Y: Up
// -Z: Down lane (Foul line is at Z = 0, Pins are at Z = -18.288)
// +Z: Approach deck (Bowler stands around Z = +3.0)

export const PIN_SPOTS = [
  // Pin 1 (Head pin)
  { id: 1, x: 0, z: -DIMENSIONS.LANE_LENGTH },

  // Row 2: Pins 2 & 3
  { id: 2, x: -DIMENSIONS.PIN_DISTANCE * Math.sin(Math.PI / 6), z: -DIMENSIONS.LANE_LENGTH - DIMENSIONS.PIN_DISTANCE * Math.cos(Math.PI / 6) },
  { id: 3, x:  DIMENSIONS.PIN_DISTANCE * Math.sin(Math.PI / 6), z: -DIMENSIONS.LANE_LENGTH - DIMENSIONS.PIN_DISTANCE * Math.cos(Math.PI / 6) },

  // Row 3: Pins 4, 5, 6
  { id: 4, x: -DIMENSIONS.PIN_DISTANCE, z: -DIMENSIONS.LANE_LENGTH - 2 * DIMENSIONS.PIN_DISTANCE * Math.cos(Math.PI / 6) },
  { id: 5, x:  0,                       z: -DIMENSIONS.LANE_LENGTH - 2 * DIMENSIONS.PIN_DISTANCE * Math.cos(Math.PI / 6) },
  { id: 6, x:  DIMENSIONS.PIN_DISTANCE, z: -DIMENSIONS.LANE_LENGTH - 2 * DIMENSIONS.PIN_DISTANCE * Math.cos(Math.PI / 6) },

  // Row 4: Pins 7, 8, 9, 10
  { id: 7,  x: -1.5 * DIMENSIONS.PIN_DISTANCE, z: -DIMENSIONS.LANE_LENGTH - 3 * DIMENSIONS.PIN_DISTANCE * Math.cos(Math.PI / 6) },
  { id: 8,  x: -0.5 * DIMENSIONS.PIN_DISTANCE, z: -DIMENSIONS.LANE_LENGTH - 3 * DIMENSIONS.PIN_DISTANCE * Math.cos(Math.PI / 6) },
  { id: 9,  x:  0.5 * DIMENSIONS.PIN_DISTANCE, z: -DIMENSIONS.LANE_LENGTH - 3 * DIMENSIONS.PIN_DISTANCE * Math.cos(Math.PI / 6) },
  { id: 10, x:  1.5 * DIMENSIONS.PIN_DISTANCE, z: -DIMENSIONS.LANE_LENGTH - 3 * DIMENSIONS.PIN_DISTANCE * Math.cos(Math.PI / 6) }
];

export const DIFFICULTY_SETTINGS = {
  easy: {
    name: 'Easy',
    description: 'Bumper rails active, full trajectory assist line, high pin bounce & carry.',
    hasBumpers: true,
    trajectoryGuide: 'full',      // Full projected line to pins
    pinScatterMultiplier: 1.45,  // Extra energetic pin collisions
    hookMultiplier: 1.25,
    oilPattern: 'recreational',
    pocketTolerance: 0.12,       // Forgiving pocket hit radius
    minVelocity: 6.5,            // ~14.5 MPH
    maxVelocity: 8.8             // ~19.7 MPH
  },
  medium: {
    name: 'Medium',
    description: 'Standard league lane, short arrow aim guide, realistic House oil pattern and hook.',
    hasBumpers: false,
    trajectoryGuide: 'short',     // Guide ends at target arrows (15 ft)
    pinScatterMultiplier: 1.0,   // Standard USBC physics
    hookMultiplier: 1.0,
    oilPattern: 'house',
    pocketTolerance: 0.07,
    minVelocity: 6.2,            // ~13.9 MPH
    maxVelocity: 9.0             // ~20.1 MPH
  },
  hard: {
    name: 'Hard',
    description: 'PBA Sport pattern, zero aim guide, sensitive lane friction, true pocket precision required.',
    hasBumpers: false,
    trajectoryGuide: 'none',      // No guide, spot bowl only
    pinScatterMultiplier: 0.88,  // Punishes light / high hits with corner pins/splits
    hookMultiplier: 0.85,
    oilPattern: 'sport',
    pocketTolerance: 0.038,
    minVelocity: 5.8,            // ~13.0 MPH
    maxVelocity: 9.4             // ~21.0 MPH
  }
};

export const BALL_PRESETS = [
  {
    id: 'inferno',
    name: 'Inferno Firestorm',
    weight: 15,
    mass: 6.8,
    primaryColor: '#e63946',
    secondaryColor: '#f77f00',
    swirlColor: '#1d1a19',
    roughness: 0.18,
    metalness: 0.15,
    hookRating: 'Aggressive'
  },
  {
    id: 'cosmic',
    name: 'Cosmic Nebula',
    weight: 14,
    mass: 6.35,
    primaryColor: '#7209b7',
    secondaryColor: '#4361ee',
    swirlColor: '#f72585',
    roughness: 0.15,
    metalness: 0.25,
    hookRating: 'Balanced'
  },
  {
    id: 'toxic',
    name: 'Toxic Emerald',
    weight: 14,
    mass: 6.35,
    primaryColor: '#06d6a0',
    secondaryColor: '#118ab2',
    swirlColor: '#073b4c',
    roughness: 0.16,
    metalness: 0.2,
    hookRating: 'Smooth'
  },
  {
    id: 'stealth',
    name: 'Carbon Stealth',
    weight: 16,
    mass: 7.26,
    primaryColor: '#1a1a1a',
    secondaryColor: '#2b2b2b',
    swirlColor: '#ff0055',
    roughness: 0.22,
    metalness: 0.35,
    hookRating: 'Heavy Crushing'
  },
  {
    id: 'royal',
    name: 'Royal Gold',
    weight: 12,
    mass: 5.44,
    primaryColor: '#e9c46a',
    secondaryColor: '#f4a261',
    swirlColor: '#ffffff',
    roughness: 0.12,
    metalness: 0.45,
    hookRating: 'Fast Light'
  }
];
