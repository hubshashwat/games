/**
 * Main Application Entry Point for Cat and Snake
 */

import './ui/styles.css';
import { GameEngine } from './core/GameEngine.js';

window.addEventListener('DOMContentLoaded', () => {
  const canvasContainer = document.getElementById('canvas-container');
  const uiContainer = document.getElementById('ui-container');

  if (!canvasContainer || !uiContainer) {
    console.error('Critical DOM containers missing!');
    return;
  }

  // Launch Game Engine
  window.gameEngine = new GameEngine(canvasContainer, uiContainer);
});
