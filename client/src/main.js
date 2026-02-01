import { Game } from './game/Game.js';
import { UIManager } from './ui/UIManager.js';
import { GaragePreview } from './ui/GaragePreview.js';

let game;
let uiManager;
let garagePreview;

// Initialize on load
window.addEventListener('DOMContentLoaded', async () => {
  uiManager = new UIManager();

  // Simulate loading
  await simulateLoading();

  // Initialize game
  game = new Game(uiManager);
  await game.initialize();

  // Initialize garage 3D preview
  const previewCanvas = document.getElementById('garage-preview-canvas');
  if (previewCanvas) {
    garagePreview = new GaragePreview(previewCanvas);
  }

  // Hide loading screen and show garage
  uiManager.hideLoading();
  uiManager.showGarage();

  // Set up garage event listeners
  setupGarageListeners();
});

async function simulateLoading() {
  const progressFill = document.getElementById('progress-fill');
  const loadingText = document.getElementById('loading-text');

  const steps = [
    { progress: 20, text: 'Loading Three.js...' },
    { progress: 40, text: 'Building track...' },
    { progress: 60, text: 'Spawning vehicles...' },
    { progress: 80, text: 'Adding snow effects...' },
    { progress: 100, text: 'Ready!' }
  ];

  for (const step of steps) {
    await new Promise(resolve => setTimeout(resolve, 300));
    progressFill.style.width = step.progress + '%';
    loadingText.textContent = step.text;
  }

  await new Promise(resolve => setTimeout(resolve, 500));
}

function setupGarageListeners() {
  const previewColor = document.getElementById('preview-color');
  const previewWheels = document.getElementById('preview-wheels');

  const colorLabelMap = {
    red: 'Red',
    blue: 'Blue',
    green: 'Green',
    yellow: 'Yellow'
  };

  const wheelLabelMap = {
    standard: 'Standard',
    sport: 'Sport',
    offroad: 'Off-Road'
  };

  // Color selection
  document.querySelectorAll('#color-options .car-option').forEach(option => {
    option.addEventListener('click', () => {
      document.querySelectorAll('#color-options .car-option').forEach(opt =>
        opt.classList.remove('selected')
      );
      option.classList.add('selected');

      const color = option.dataset.color;
      game.setCarColor(color);

      if (garagePreview) {
        garagePreview.setColor(color);
      }
      if (previewColor) {
        previewColor.textContent = colorLabelMap[color] || color;
      }
    });
  });

  // Wheel selection
  document.querySelectorAll('#wheel-options .car-option').forEach(option => {
    option.addEventListener('click', () => {
      document.querySelectorAll('#wheel-options .car-option').forEach(opt =>
        opt.classList.remove('selected')
      );
      option.classList.add('selected');

      const wheel = option.dataset.wheel;
      game.setWheelType(wheel);

      if (garagePreview) {
        garagePreview.setWheelType(wheel);
      }
      if (previewWheels) {
        previewWheels.textContent = wheelLabelMap[wheel] || wheel;
      }
    });
  });

  // Coach selection
  document.querySelectorAll('#coach-options .coach-card').forEach(option => {
    option.addEventListener('click', () => {
      document.querySelectorAll('#coach-options .coach-card').forEach(opt =>
        opt.classList.remove('selected')
      );
      option.classList.add('selected');

      const coach = option.dataset.coach;
      game.setCoachPersonality(coach);
    });
  });

  // AI Theme Generator
  document.getElementById('generate-theme').addEventListener('click', async () => {
    const keywordsInput = document.getElementById('theme-keywords');
    const keywords = keywordsInput.value.trim();
    const statusDiv = document.getElementById('theme-status');
    const generateBtn = document.getElementById('generate-theme');

    if (!keywords) {
      statusDiv.textContent = '⚠️ Please enter some keywords';
      statusDiv.style.color = '#ff6b6b';
      return;
    }

    // Disable button during generation
    generateBtn.disabled = true;
    generateBtn.textContent = 'Generating...';
    statusDiv.textContent = '🎨 AI is creating your theme...';
    statusDiv.style.color = '#4facfe';

    try {
      const apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:3001';
      const response = await fetch(`${apiBase}/api/gemini/generate-theme`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ keywords })
      });

      const data = await response.json();

      if (data.color) {
        game.setCarColor(data.color);

        if (garagePreview) {
          garagePreview.setColor(data.color);
        }
        if (previewColor) {
          previewColor.textContent = data.color.toUpperCase();
        }

        // Deselect all preset colors (since AI generated a custom color)
        document.querySelectorAll('#color-options .car-option').forEach(opt =>
          opt.classList.remove('selected')
        );

        // Check if it matches a preset color, select it if so
        const matchingOption = document.querySelector(`#color-options .car-option[data-color="${data.color}"]`);
        if (matchingOption) {
          matchingOption.classList.add('selected');
          statusDiv.textContent = `✨ Applied ${data.color} theme!`;
        } else {
          // Custom hex color
          statusDiv.textContent = `✨ Applied custom color ${data.color}!`;
        }
        statusDiv.style.color = '#51cf66';
      } else {
        statusDiv.textContent = '⚠️ Could not generate theme';
        statusDiv.style.color = '#ff6b6b';
      }
    } catch (error) {
      console.error('Theme generation failed:', error);
      statusDiv.textContent = '❌ Generation failed. Try again!';
      statusDiv.style.color = '#ff6b6b';
    } finally {
      generateBtn.disabled = false;
      generateBtn.textContent = 'Generate ✨';
    }
  });

  // Start race button
  document.getElementById('start-race').addEventListener('click', () => {
    uiManager.hideGarage();
    uiManager.showHUD();
    game.startRace();
  });

  // Restart button
  document.getElementById('restart-race').addEventListener('click', () => {
    uiManager.hideResults();
    uiManager.showGarage();
    game.resetRace();
  });
}
