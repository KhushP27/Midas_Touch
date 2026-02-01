export class ScoringManager {
  constructor(uiManager) {
    this.uiManager = uiManager;
    this.score = 0;
    this.collisions = 0;
    this.completedSections = [];
    this.currentObjective = 'Pick up the box and deliver it to the blue circle';
  }

  addScore(points) {
    this.score += points;
    this.uiManager.updateScore(this.score);
  }

  addCollision() {
    this.collisions++;
  }

  addObjective(section) {
    if (!this.completedSections.includes(section)) {
      this.completedSections.push(section);
    }
  }

  setObjective(text) {
    this.currentObjective = text;
    this.uiManager.updateObjective(text);
  }

  isRaceComplete() {
    return this.completedSections.includes('finish-reached');
  }

  getScore() {
    return this.score;
  }

  getCollisions() {
    return this.collisions;
  }

  getCompletedSections() {
    return [...this.completedSections];
  }

  getCurrentObjective() {
    return this.currentObjective;
  }

  reset() {
    this.score = 0;
    this.collisions = 0;
    this.completedSections = [];
    this.currentObjective = 'Pick up the box and deliver it to the blue circle';
    this.uiManager.updateScore(0);
    this.uiManager.updateObjective(this.currentObjective);
  }
}
