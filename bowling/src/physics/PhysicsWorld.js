import * as CANNON from 'cannon-es';
import { DIMENSIONS, PIN_SPOTS, DIFFICULTY_SETTINGS } from '../config.js';
import { soundManager } from '../audio/SoundManager.js';

/**
 * Cannon-es Physics World
 * Implements realistic bowling lane friction, oil patterns, pin compound shapes, and bumper dynamics.
 */
export class PhysicsWorld {
  constructor() {
    this.world = new CANNON.World();
    this.world.gravity.set(0, -9.81, 0);

    // Default broadphase and solver settings for precision
    this.world.broadphase = new CANNON.SAPBroadphase(this.world);
    this.world.solver.iterations = 15;
    this.world.solver.tolerance = 0.001;

    this.difficulty = 'medium';
    this.bumpersEnabled = false;

    // Contact Materials
    this.laneMaterial = new CANNON.Material('lane');
    this.ballMaterial = new CANNON.Material('ball');
    this.pinMaterial = new CANNON.Material('pin');
    this.bumperMaterial = new CANNON.Material('bumper');
    this.gutterMaterial = new CANNON.Material('gutter');

    this.setupContactMaterials();

    // Physics Bodies
    this.laneBody = null;
    this.gutterLeftBody = null;
    this.gutterRightBody = null;
    this.bumperLeftBody = null;
    this.bumperRightBody = null;
    this.backPitBody = null;
    this.backCurtainBody = null;

    this.pinBodies = [];
    this.ballBody = null;

    // State tracking
    this.ballInGutter = false;
    this.firstImpactOccurred = false;

    this.buildStaticAlley();
  }

  setupContactMaterials() {
    // Ball vs Lane
    const ballLaneContact = new CANNON.ContactMaterial(this.ballMaterial, this.laneMaterial, {
      friction: 0.0, // Lane sliding & rolling friction is accurately simulated dynamically via oil patterns in step()
      restitution: 0.08,
      contactEquationStiffness: 1e7,
      contactEquationRelaxation: 2
    });
    this.world.addContactMaterial(ballLaneContact);

    // Ball vs Pin
    const ballPinContact = new CANNON.ContactMaterial(this.ballMaterial, this.pinMaterial, {
      friction: 0.15,
      restitution: 0.65, // Elastic lively impact
      contactEquationStiffness: 1e8,
      contactEquationRelaxation: 1.5
    });
    this.world.addContactMaterial(ballPinContact);

    // Pin vs Pin
    const pinPinContact = new CANNON.ContactMaterial(this.pinMaterial, this.pinMaterial, {
      friction: 0.22,
      restitution: 0.58,
      contactEquationStiffness: 1e8,
      contactEquationRelaxation: 2
    });
    this.world.addContactMaterial(pinPinContact);

    // Pin vs Lane
    const pinLaneContact = new CANNON.ContactMaterial(this.pinMaterial, this.laneMaterial, {
      friction: 0.35,
      restitution: 0.18,
      contactEquationStiffness: 1e7,
      contactEquationRelaxation: 3
    });
    this.world.addContactMaterial(pinLaneContact);

    // Ball/Pin vs Bumper
    const ballBumperContact = new CANNON.ContactMaterial(this.ballMaterial, this.bumperMaterial, {
      friction: 0.05,
      restitution: 0.85, // Springy bounce off bumpers
      contactEquationStiffness: 1e8,
      contactEquationRelaxation: 1.5
    });
    this.world.addContactMaterial(ballBumperContact);

    // Ball vs Gutter
    const ballGutterContact = new CANNON.ContactMaterial(this.ballMaterial, this.gutterMaterial, {
      friction: 0.15,
      restitution: 0.1,
      contactEquationStiffness: 1e7,
      contactEquationRelaxation: 3
    });
    this.world.addContactMaterial(ballGutterContact);
  }

  buildStaticAlley() {
    const totalLength = DIMENSIONS.APPROACH_LENGTH + DIMENSIONS.LANE_LENGTH + DIMENSIONS.PIN_DECK_LENGTH;
    const centerZ = (DIMENSIONS.APPROACH_LENGTH - (DIMENSIONS.LANE_LENGTH + DIMENSIONS.PIN_DECK_LENGTH)) / 2;

    // 1. Lane bed
    const laneShape = new CANNON.Box(new CANNON.Vec3(
      DIMENSIONS.LANE_WIDTH / 2,
      0.1,
      totalLength / 2
    ));
    this.laneBody = new CANNON.Body({
      mass: 0,
      material: this.laneMaterial,
      position: new CANNON.Vec3(0, -0.1, centerZ)
    });
    this.laneBody.addShape(laneShape);
    this.world.addBody(this.laneBody);

    // 2. Gutters (Sunken channels on left and right)
    const gutterShape = new CANNON.Box(new CANNON.Vec3(
      DIMENSIONS.GUTTER_WIDTH / 2,
      0.1,
      (DIMENSIONS.LANE_LENGTH + DIMENSIONS.PIN_DECK_LENGTH) / 2
    ));
    const gutterZ = -(DIMENSIONS.LANE_LENGTH + DIMENSIONS.PIN_DECK_LENGTH) / 2;

    // Left Gutter
    const leftGutterX = -(DIMENSIONS.LANE_WIDTH / 2 + DIMENSIONS.GUTTER_WIDTH / 2);
    this.gutterLeftBody = new CANNON.Body({
      mass: 0,
      material: this.gutterMaterial,
      position: new CANNON.Vec3(leftGutterX, -0.1 - DIMENSIONS.GUTTER_DEPTH, gutterZ)
    });
    this.gutterLeftBody.addShape(gutterShape);
    this.world.addBody(this.gutterLeftBody);

    // Right Gutter
    const rightGutterX = (DIMENSIONS.LANE_WIDTH / 2 + DIMENSIONS.GUTTER_WIDTH / 2);
    this.gutterRightBody = new CANNON.Body({
      mass: 0,
      material: this.gutterMaterial,
      position: new CANNON.Vec3(rightGutterX, -0.1 - DIMENSIONS.GUTTER_DEPTH, gutterZ)
    });
    this.gutterRightBody.addShape(gutterShape);
    this.world.addBody(this.gutterRightBody);

    // Outer Gutter Walls (Prevent ball flying off into the void)
    const outerWallShape = new CANNON.Box(new CANNON.Vec3(0.05, 0.25, (DIMENSIONS.LANE_LENGTH + DIMENSIONS.PIN_DECK_LENGTH) / 2));
    const leftWall = new CANNON.Body({
      mass: 0,
      material: this.gutterMaterial,
      position: new CANNON.Vec3(-(DIMENSIONS.LANE_WIDTH / 2 + DIMENSIONS.GUTTER_WIDTH + 0.05), 0.1, gutterZ)
    });
    leftWall.addShape(outerWallShape);
    this.world.addBody(leftWall);

    const rightWall = new CANNON.Body({
      mass: 0,
      material: this.gutterMaterial,
      position: new CANNON.Vec3((DIMENSIONS.LANE_WIDTH / 2 + DIMENSIONS.GUTTER_WIDTH + 0.05), 0.1, gutterZ)
    });
    rightWall.addShape(outerWallShape);
    this.world.addBody(rightWall);

    // 3. Back Pit and Cushion Curtain (stops ball and pins)
    const pitShape = new CANNON.Box(new CANNON.Vec3(1.2, 0.1, DIMENSIONS.PIT_DEPTH / 2));
    const pitZ = -(DIMENSIONS.LANE_LENGTH + DIMENSIONS.PIN_DECK_LENGTH + DIMENSIONS.PIT_DEPTH / 2);
    this.backPitBody = new CANNON.Body({
      mass: 0,
      position: new CANNON.Vec3(0, -0.3, pitZ)
    });
    this.backPitBody.addShape(pitShape);
    this.world.addBody(this.backPitBody);

    // Back curtain impact cushion
    const curtainShape = new CANNON.Box(new CANNON.Vec3(1.2, 0.6, 0.08));
    this.backCurtainBody = new CANNON.Body({
      mass: 0,
      position: new CANNON.Vec3(0, 0.3, -(DIMENSIONS.LANE_LENGTH + DIMENSIONS.PIN_DECK_LENGTH + DIMENSIONS.PIT_DEPTH))
    });
    this.backCurtainBody.addShape(curtainShape);
    this.world.addBody(this.backCurtainBody);

    // 4. Bumper Rails (Retractable)
    const bumperShape = new CANNON.Cylinder(
      DIMENSIONS.BUMPER_RADIUS,
      DIMENSIONS.BUMPER_RADIUS,
      DIMENSIONS.LANE_LENGTH,
      12
    );
    const bQuat = new CANNON.Quaternion();
    bQuat.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), Math.PI / 2);

    const bumperZ = -DIMENSIONS.LANE_LENGTH / 2;

    // Left Bumper
    this.bumperLeftBody = new CANNON.Body({
      mass: 0,
      material: this.bumperMaterial,
      position: new CANNON.Vec3(-DIMENSIONS.LANE_WIDTH / 2, -1.0, bumperZ) // Initially lowered
    });
    this.bumperLeftBody.addShape(bumperShape, new CANNON.Vec3(0, 0, 0), bQuat);
    this.world.addBody(this.bumperLeftBody);

    // Right Bumper
    this.bumperRightBody = new CANNON.Body({
      mass: 0,
      material: this.bumperMaterial,
      position: new CANNON.Vec3(DIMENSIONS.LANE_WIDTH / 2, -1.0, bumperZ) // Initially lowered
    });
    this.bumperRightBody.addShape(bumperShape, new CANNON.Vec3(0, 0, 0), bQuat);
    this.world.addBody(this.bumperRightBody);
  }

  setDifficulty(difficulty, forceBumpers = null) {
    this.difficulty = difficulty;
    const cfg = DIFFICULTY_SETTINGS[difficulty];
    this.bumpersEnabled = forceBumpers !== null ? forceBumpers : cfg.hasBumpers;

    // Raise or lower bumpers in physics
    const bumperY = this.bumpersEnabled ? DIMENSIONS.BUMPER_HEIGHT : -1.0;
    this.bumperLeftBody.position.y = bumperY;
    this.bumperRightBody.position.y = bumperY;

    // Dynamically adjust pin bounce & carry based on difficulty level:
    // Easy: High restitution (~0.84) -> explosive pin scattering and domino strikes!
    // Medium: Regulation USBC restitution (0.58) -> realistic league carry.
    // Hard: Deadened restitution (~0.48) -> reduced bounce, off-pocket hits leave nasty corner pins & splits!
    const basePinPinRestitution = 0.58;
    const pinPinRest = Math.max(0.35, Math.min(0.85, basePinPinRestitution * cfg.pinScatterMultiplier));
    const ballPinRest = Math.max(0.45, Math.min(0.85, 0.65 * Math.min(1.2, cfg.pinScatterMultiplier)));

    for (const cm of this.world.contactmaterials) {
      if (cm.materials.includes(this.pinMaterial) && cm.materials.includes(this.pinMaterial)) {
        cm.restitution = pinPinRest;
      }
      if (cm.materials.includes(this.ballMaterial) && cm.materials.includes(this.pinMaterial)) {
        cm.restitution = ballPinRest;
      }
    }
  }

  /**
   * Spawns or resets the 10 bowling pins in regulation triangular formation.
   * @param {number[]} activePinIds - Which pins should be set (e.g. [1,2..10] on roll 1, or standing pins on roll 2)
   */
  setupPins(activePinIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]) {
    // Remove existing pins from physics world
    this.pinBodies.forEach(p => this.world.removeBody(p.body));
    this.pinBodies = [];

    const activeSet = new Set(activePinIds);

    PIN_SPOTS.forEach(spot => {
      if (!activeSet.has(spot.id)) return;

      // Create compound shape for pin:
      // Real bowling pin center of mass is around 35-38% from base.
      // We position the body origin near the center of mass (Y = 0.14m from base).
      const pinBody = new CANNON.Body({
        mass: DIMENSIONS.PIN_MASS,
        material: this.pinMaterial,
        linearDamping: 0.08,
        angularDamping: 0.12,
        position: new CANNON.Vec3(spot.x, DIMENSIONS.PIN_HEIGHT * 0.45, spot.z)
      });

      // Compound collision shapes:
      // 1. Belly sphere (widest part)
      const bellyShape = new CANNON.Sphere(DIMENSIONS.PIN_RADIUS_BELLY);
      pinBody.addShape(bellyShape, new CANNON.Vec3(0, -0.04, 0));

      // 2. Base cylinder (keeps pin standing upright stably)
      const baseShape = new CANNON.Cylinder(
        DIMENSIONS.PIN_RADIUS_BASE * 1.05,
        DIMENSIONS.PIN_RADIUS_BASE * 1.05,
        0.06,
        12
      );
      pinBody.addShape(baseShape, new CANNON.Vec3(0, -DIMENSIONS.PIN_HEIGHT * 0.45 + 0.03, 0));

      // 3. Head & neck sphere
      const headShape = new CANNON.Sphere(DIMENSIONS.PIN_RADIUS_HEAD);
      pinBody.addShape(headShape, new CANNON.Vec3(0, 0.15, 0));

      // Listen for collisions to play realistic sound
      pinBody.addEventListener('collide', (e) => {
        const contact = e.contact;
        const impactForce = contact.getImpactVelocityAlongNormal();
        if (impactForce > 0.4) {
          if (!this.firstImpactOccurred) {
            this.firstImpactOccurred = true;
            soundManager.playPinHit(impactForce);
          } else {
            soundManager.playPinClatter();
          }
        }
      });

      this.world.addBody(pinBody);
      this.pinBodies.push({
        id: spot.id,
        initialSpot: spot,
        body: pinBody
      });
    });

    this.firstImpactOccurred = false;
  }

  /**
   * Spawns and launches bowling ball
   * @param {Object} ballPreset - Ball specs (mass, weight)
   * @param {number} startX - Position across approach (-0.45 to +0.45)
   * @param {number} angle - Aim angle in radians (left/right deviation)
   * @param {number} speed - Forward speed (m/s)
   * @param {number} spinRpm - Lateral spin (rpm: -400 to +400, + = right hook, - = left hook)
   */
  launchBall(ballPreset, startX, angle, speed, spinRpm) {
    if (this.ballBody) {
      this.world.removeBody(this.ballBody);
      this.ballBody = null;
    }

    const ballShape = new CANNON.Sphere(DIMENSIONS.BALL_RADIUS);
    this.ballBody = new CANNON.Body({
      mass: ballPreset.mass,
      material: this.ballMaterial,
      linearDamping: 0.03,
      angularDamping: 0.04,
      position: new CANNON.Vec3(startX, DIMENSIONS.BALL_RADIUS, -0.6) // At lane head
    });
    this.ballBody.addShape(ballShape);

    // Initial linear velocity vector
    const vx = Math.sin(angle) * speed;
    const vz = -Math.cos(angle) * speed;
    this.ballBody.velocity.set(vx, 0, vz);

    // Angular velocity:
    // Rolling forward rotation around X axis (pointing towards -Z)
    const rollOmegaX = -speed / DIMENSIONS.BALL_RADIUS;
    // Side spin (hook rotation around Z)
    // Negative sign ensures +spinRpm hooks right (+X) and -spinRpm hooks left (-X)
    const hookOmegaZ = -(spinRpm * 2 * Math.PI) / 60;
    this.ballBody.angularVelocity.set(rollOmegaX, 0, hookOmegaZ);

    this.ballInGutter = false;
    this.firstImpactOccurred = false;

    // Detect gutter, bumper, and pin collisions
    this.ballBody.addEventListener('collide', (e) => {
      const other = e.body;
      if (other === this.bumperLeftBody || other === this.bumperRightBody) {
        soundManager.playBumperBounce();
      } else if ((other === this.gutterLeftBody || other === this.gutterRightBody) && !this.ballInGutter && !this.firstImpactOccurred && this.ballBody.position.z > -DIMENSIONS.LANE_LENGTH) {
        this.ballInGutter = true;
        soundManager.playGutterFall();
      }

      // Check if ball collided with any pin
      if (!this.firstImpactOccurred && this.pinBodies.some(p => p.body === other)) {
        this.firstImpactOccurred = true;
        soundManager.playPinHit(8.0);
      }
    });

    this.world.addBody(this.ballBody);
    soundManager.startRolling();
  }

  /**
   * Main physics step with internal sub-stepping and realistic oil/hook traction forces.
   */
  step(dt) {
    if (!this.ballBody) {
      this.world.step(1 / 60, dt, 5);
      return;
    }

    const cfg = DIFFICULTY_SETTINGS[this.difficulty];
    const bp = this.ballBody.position;
    const bv = this.ballBody.velocity;
    const bw = this.ballBody.angularVelocity;

    // Sound manager audio update
    const currentSpeed = bv.length();
    soundManager.updateRolling(currentSpeed);

    // Check if ball dropped into gutter (only before pins impact and while along the lane)
    if (!this.ballInGutter && !this.firstImpactOccurred && bp.y < -0.02 && Math.abs(bp.x) > (DIMENSIONS.LANE_WIDTH / 2 - 0.04) && bp.z > -DIMENSIONS.LANE_LENGTH) {
      this.ballInGutter = true;
      soundManager.playGutterFall();
    }

    // Realistic Oil Pattern & Hook Traction Simulation:
    // Only apply if ball is on lane surface (not in gutter or airborne)
    if (!this.ballInGutter && bp.y >= -0.02 && bp.z > -DIMENSIONS.LANE_LENGTH && bp.z < 0.2) {
      // Lane position ratio: 0 (foul line) to 1 (head pin)
      const distRatio = Math.max(0, Math.min(1, -bp.z / DIMENSIONS.LANE_LENGTH));
      // Board index (1 to 39 across lane)
      const boardPos = ((bp.x / (DIMENSIONS.LANE_WIDTH / 2)) + 1) * 19.5;

      let grip = 0.0;
      if (cfg.oilPattern === 'recreational') {
        if (distRatio > 0.60) {
          grip = ((distRatio - 0.60) / 0.40) * 1.8;
        }
      } else if (cfg.oilPattern === 'house') {
        if (distRatio > 0.62) {
          // Dry backend grips and hooks
          grip = ((distRatio - 0.62) / 0.38) * 2.5;
        } else if (boardPos < 8 || boardPos > 32) {
          // House shot: dry outside boards provide slight recovery back toward center
          grip = 0.5;
        }
      } else if (cfg.oilPattern === 'sport') {
        if (distRatio > 0.60) {
          grip = ((distRatio - 0.60) / 0.40) * 2.8;
        }
      }

      if (grip > 0.001) {
        // Calculate lateral slip velocity at lane contact point: bv.x + bw.z * R
        const lateralSlip = bv.x + bw.z * DIMENSIONS.BALL_RADIUS;
        const hookForceX = -Math.tanh(lateralSlip * 3.0) * grip * cfg.hookMultiplier;
        this.ballBody.applyForce(new CANNON.Vec3(hookForceX, 0, 0), bp);

        // Spin damping as lane friction converts rotational hook into lateral roll
        this.ballBody.angularVelocity.z *= (1.0 - 0.015 * Math.min(1.0, grip));
      }
    }

    // Sub-stepping to prevent tunneling at high speeds
    // Fixed sub-step: 1/180s, maxSubSteps: 10
    this.world.step(1 / 60, dt, 10);

    // If ball reached back pit or stopped, stop rolling audio
    if (bp.z < -(DIMENSIONS.LANE_LENGTH + DIMENSIONS.PIN_DECK_LENGTH + 0.3) || bv.length() < 0.2) {
      soundManager.stopRolling();
    }
  }

  /**
   * Evaluates pin status (standing vs fallen) based on tilt angle and displacement.
   * @returns {Object} { standingPins: number[], fallenPins: number[], fallenCount: number }
   */
  evaluatePinStatus() {
    const standingPins = [];
    const fallenPins = [];

    const upVector = new CANNON.Vec3(0, 1, 0);

    this.pinBodies.forEach(pin => {
      const body = pin.body;
      const initialSpot = pin.initialSpot;

      // 1. Check tilt angle
      // Transform local up vector (0, 1, 0) by pin quaternion
      const pinUp = body.quaternion.vmult(upVector);
      const isUpright = pinUp.y >= 0.72; // Tilted less than ~44 degrees

      // 2. Check position displacement from initial spot
      const dx = body.position.x - initialSpot.x;
      const dz = body.position.z - initialSpot.z;
      const displacement = Math.sqrt(dx * dx + dz * dz);
      const isStillOnDeck = displacement < 0.22 && body.position.y > -0.05 && body.position.y < 0.5;

      // 3. Check if in gutter or pit
      const inGutterOrPit =
        body.position.y < -0.05 ||
        Math.abs(body.position.x) > (DIMENSIONS.LANE_WIDTH / 2 + 0.05) ||
        body.position.z < -(DIMENSIONS.LANE_LENGTH + DIMENSIONS.PIN_DECK_LENGTH + 0.1);

      if (isUpright && isStillOnDeck && !inGutterOrPit) {
        standingPins.push(pin.id);
      } else {
        fallenPins.push(pin.id);
      }
    });

    return {
      standingPins: standingPins.sort((a, b) => a - b),
      fallenPins: fallenPins.sort((a, b) => a - b),
      fallenCount: fallenPins.length
    };
  }

  /**
   * Removes dead/fallen pins after a roll (used before roll 2 of a frame)
   */
  clearFallenPins(fallenPinIds) {
    const fallenSet = new Set(fallenPinIds);
    const toRemove = [];

    this.pinBodies = this.pinBodies.filter(pin => {
      if (fallenSet.has(pin.id)) {
        toRemove.push(pin.body);
        return false;
      }
      return true;
    });

    toRemove.forEach(b => this.world.removeBody(b));
  }

  /**
   * Resets standing pins back to exact upright stationary coordinates
   */
  stabilizeStandingPins() {
    this.pinBodies.forEach(pin => {
      const spot = pin.initialSpot;
      pin.body.position.set(spot.x, DIMENSIONS.PIN_HEIGHT * 0.45, spot.z);
      pin.body.quaternion.set(0, 0, 0, 1);
      pin.body.velocity.set(0, 0, 0);
      pin.body.angularVelocity.set(0, 0, 0);
    });
  }

  removeBall() {
    if (this.ballBody) {
      soundManager.stopRolling();
      this.world.removeBody(this.ballBody);
      this.ballBody = null;
    }
  }
}
