export class AudioManager {
  constructor() {
    this.apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:3001';
    this.sounds = {};
    this.engineSound = null;
    this.announcementQueue = [];
    this.isPlayingAnnouncement = false;
    this.coachPersonality = 'motivational'; // Default coach

    // Create simple UI sound effects using Web Audio API
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    this.createSimpleSounds();
  }

  setCoachPersonality(personality) {
    this.coachPersonality = personality;
    console.log('🎙️ Coach personality set to:', personality);
  }

  createSimpleSounds() {
    // Create simple beep sounds for UI
    this.sounds.pickup = () => this.playBeep(440, 0.1);
    this.sounds.shoot = () => this.playBeep(220, 0.2);
    this.sounds.click = () => this.playBeep(880, 0.05);
  }

  playBeep(frequency, duration) {
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      this.audioContext.currentTime + duration
    );

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  playSound(soundName) {
    if (this.sounds[soundName]) {
      this.sounds[soundName]();
    }
  }

  async playAnnouncement(text, priority = 'normal', onComplete = null) {
    // Create announcement object with timestamp
    const announcement = {
      text,
      priority,
      timestamp: Date.now(),
      onComplete
    };

    // If high priority, clear existing queue (except what's playing)
    if (priority === 'high') {
      this.announcementQueue = [];
    }

    // Only keep last 2 announcements in queue to prevent backlog
    if (this.announcementQueue.length >= 2) {
      this.announcementQueue.shift(); // Remove oldest
    }

    // Add to queue
    this.announcementQueue.push(announcement);

    // If already playing, let the queue process it
    if (this.isPlayingAnnouncement) {
      console.log('🎙️ Queued announcement:', text);
      return;
    }

    // Process queue
    this.processAnnouncementQueue();
  }

  isSpeaking() {
    return this.isPlayingAnnouncement;
  }

  async processAnnouncementQueue() {
    // If queue is empty or already playing, stop
    if (this.announcementQueue.length === 0 || this.isPlayingAnnouncement) {
      return;
    }

    // Mark as playing
    this.isPlayingAnnouncement = true;

    // Get next announcement
    const announcement = this.announcementQueue.shift();

    // Skip if announcement is too old (more than 8 seconds)
    const age = Date.now() - announcement.timestamp;
    if (age > 8000) {
      console.log('🎙️ Skipping stale announcement:', announcement.text);
      this.isPlayingAnnouncement = false;
      // Call onComplete callback if provided
      if (announcement.onComplete) {
        announcement.onComplete();
      }
      this.processAnnouncementQueue(); // Process next
      return;
    }

    const text = announcement.text;
    const onComplete = announcement.onComplete;
    console.log('🎙️ Playing announcement:', text);

    try {
      const response = await fetch(`${this.apiBase}/api/tts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text,
          coachPersonality: this.coachPersonality
        })
      });

      if (!response.ok) {
        console.warn('TTS not available, skipping announcement');
        this.isPlayingAnnouncement = false;
        // Call onComplete callback if provided
        if (onComplete) {
          onComplete();
        }
        this.processAnnouncementQueue(); // Process next in queue
        return;
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);

      // When audio ends, mark as not playing and process next
      audio.onended = () => {
        console.log('🎙️ Announcement finished');
        this.isPlayingAnnouncement = false;
        // Call onComplete callback if provided
        if (onComplete) {
          onComplete();
        }
        // Small delay before next announcement
        setTimeout(() => this.processAnnouncementQueue(), 300);
      };

      // If audio fails, still process next
      audio.onerror = () => {
        console.warn('Audio playback error');
        this.isPlayingAnnouncement = false;
        // Call onComplete callback if provided
        if (onComplete) {
          onComplete();
        }
        this.processAnnouncementQueue();
      };

      await audio.play();
    } catch (error) {
      console.warn('TTS announcement failed:', error);
      this.isPlayingAnnouncement = false;
      // Call onComplete callback if provided
      if (onComplete) {
        onComplete();
      }
      this.processAnnouncementQueue(); // Process next in queue
    }
  }

  update(speed) {
    // Simple engine sound simulation based on speed
    // In a real game, you'd load actual audio files
    if (speed > 1 && !this.engineSound) {
      // Engine sound would go here
    } else if (speed < 0.5 && this.engineSound) {
      // Stop engine sound
      this.engineSound = null;
    }
  }
}
