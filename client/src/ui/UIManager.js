export class UIManager {
  constructor() {
    this.loadingScreen = document.getElementById('loading-screen');
    this.garageScreen = document.getElementById('garage-screen');
    this.hud = document.getElementById('hud');
    this.resultsScreen = document.getElementById('results-screen');

    // HUD elements
    this.timerElement = document.getElementById('timer');
    this.scoreElement = document.getElementById('score');
    this.speedometerElement = document.getElementById('speedometer');
    this.objectiveElement = document.getElementById('objective');
    this.chargeBarContainer = document.getElementById('charge-bar-container');
    this.chargeFill = document.getElementById('charge-fill');

    // Results elements
    this.finalTimeElement = document.getElementById('final-time');
    this.finalScoreElement = document.getElementById('final-score');
    this.finalCollisionsElement = document.getElementById('final-collisions');
    this.aiTipsList = document.getElementById('ai-tips-list');

    // Coaching overlay
    this.coachingTextElement = document.getElementById('coaching-text');
    this.coachingTimeout = null;
  }

  hideLoading() {
    this.loadingScreen.style.display = 'none';
  }

  showGarage() {
    this.garageScreen.style.display = 'flex';
    this.hud.style.display = 'none';
    this.resultsScreen.style.display = 'none';
  }

  hideGarage() {
    this.garageScreen.style.display = 'none';
  }

  showHUD() {
    this.hud.style.display = 'block';
  }

  hideHUD() {
    this.hud.style.display = 'none';
  }

  showResults(timeMs, score, collisions) {
    this.hideHUD();
    this.resultsScreen.style.display = 'flex';

    this.finalTimeElement.textContent = (timeMs / 1000).toFixed(1) + 's';
    this.finalScoreElement.textContent = score;
    this.finalCollisionsElement.textContent = collisions;
  }

  hideResults() {
    this.resultsScreen.style.display = 'none';
  }

  updateTimer(timeMs) {
    this.timerElement.textContent = (timeMs / 1000).toFixed(1) + 's';
  }

  updateScore(score) {
    this.scoreElement.textContent = score;
  }

  updateSpeedometer(speedKMH) {
    this.speedometerElement.textContent = Math.floor(speedKMH);
  }

  updateObjective(text) {
    this.objectiveElement.textContent = 'Objective: ' + text;
  }

  showChargeBar() {
    this.chargeBarContainer.style.display = 'block';
  }

  hideChargeBar() {
    this.chargeBarContainer.style.display = 'none';
  }

  updateChargeBar(percent) {
    this.chargeFill.style.width = (percent * 100) + '%';
  }

  setAITips(tips) {
    this.aiTipsList.innerHTML = '';
    tips.forEach(tip => {
      const li = document.createElement('li');
      li.textContent = tip;
      this.aiTipsList.appendChild(li);
    });
  }

  showCoachingText(text, duration = null) {
    // Clear any existing timeout
    if (this.coachingTimeout) {
      clearTimeout(this.coachingTimeout);
      this.coachingTimeout = null;
    }

    // Set text and show
    this.coachingTextElement.textContent = text;
    this.coachingTextElement.classList.remove('fade-out');
    this.coachingTextElement.classList.add('show');

    // Only auto-hide if duration is provided (for non-audio coaching)
    // Otherwise, let it stay visible until explicitly hidden
    if (duration) {
      this.coachingTimeout = setTimeout(() => {
        this.hideCoachingText();
      }, duration);
    }
  }

  hideCoachingText() {
    this.coachingTextElement.classList.remove('show');
    this.coachingTextElement.classList.add('fade-out');

    // Clear timeout if exists
    if (this.coachingTimeout) {
      clearTimeout(this.coachingTimeout);
      this.coachingTimeout = null;
    }
  }
}
