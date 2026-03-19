export class AudioBus {
  constructor({ muted = false } = {}) {
    this.muted = muted;
    // Using WebAudio is optional; keep simple for now
    this.enabled = !muted;
  }
  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }
  play(name) {
    if (this.muted) return;
    // Placeholder for future sounds
  }
}

