// Web Audio API Ambient Sound Synthesizer
// Generates relaxing soundscapes purely in-code, 100% offline, without external audio assets.

class AmbientSynthesizer {
  private ctx: AudioContext | null = null;
  private noiseNode: AudioBufferSourceNode | null = null;
  private filterNode: BiquadFilterNode | null = null;
  private gainNode: GainNode | null = null;
  private lfoNode: OscillatorNode | null = null;
  private lfoGain: GainNode | null = null;
  private isPlaying = false;
  private currentSoundType: 'rain' | 'waves' | 'wind' | 'off' = 'off';

  private initContext() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Generate 2 seconds of stereo white noise buffer
  private createNoiseBuffer(): AudioBuffer {
    if (!this.ctx) throw new Error('AudioContext not initialized');
    const bufferSize = this.ctx.sampleRate * 2; // 2 seconds
    const buffer = this.ctx.createBuffer(2, bufferSize, this.ctx.sampleRate);

    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const data = buffer.getChannelData(channel);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
    }
    return buffer;
  }

  public play(type: 'rain' | 'waves' | 'wind') {
    this.stop();
    this.initContext();
    if (!this.ctx) return;

    this.isPlaying = true;
    this.currentSoundType = type;

    // Create Nodes
    this.noiseNode = this.ctx.createBufferSource();
    this.noiseNode.buffer = this.createNoiseBuffer();
    this.noiseNode.loop = true;

    this.filterNode = this.ctx.createBiquadFilter();
    this.gainNode = this.ctx.createGain();

    // Sound configuration
    if (type === 'rain') {
      // Steady rain: Lowpassed noise around 800Hz
      this.filterNode.type = 'lowpass';
      this.filterNode.frequency.value = 750;
      this.gainNode.gain.value = 0.25;

      this.noiseNode.connect(this.filterNode);
      this.filterNode.connect(this.gainNode);
      this.gainNode.connect(this.ctx.destination);
    } 
    else if (type === 'waves') {
      // Ocean waves: Modulate the volume slowly using an LFO (0.08Hz sine wave)
      this.filterNode.type = 'lowpass';
      this.filterNode.frequency.value = 400; // Deep ocean rumble
      
      this.lfoNode = this.ctx.createOscillator();
      this.lfoNode.type = 'sine';
      this.lfoNode.frequency.value = 0.08; // One swell every ~12 seconds

      this.lfoGain = this.ctx.createGain();
      this.lfoGain.gain.value = 0.15; // Volume variation depth

      this.gainNode.gain.value = 0.18; // Base volume

      // Connect LFO to modulate main Gain Node gain value
      this.lfoNode.connect(this.lfoGain);
      this.lfoGain.connect(this.gainNode.gain);

      this.noiseNode.connect(this.filterNode);
      this.filterNode.connect(this.gainNode);
      this.gainNode.connect(this.ctx.destination);

      this.lfoNode.start();
    } 
    else if (type === 'wind') {
      // Cozy howling wind: Modulate the filter cutoff frequency with an LFO
      this.filterNode.type = 'bandpass';
      this.filterNode.frequency.value = 400;
      this.filterNode.Q.value = 3.0; // Higher sharpness for wind whistle

      this.lfoNode = this.ctx.createOscillator();
      this.lfoNode.type = 'sine';
      this.lfoNode.frequency.value = 0.15; // Slow variation

      this.lfoGain = this.ctx.createGain();
      this.lfoGain.gain.value = 250; // Sweeping range (Hz)

      this.gainNode.gain.value = 0.4;

      // Connect LFO to modulate Filter Cutoff Frequency
      this.lfoNode.connect(this.lfoGain);
      this.lfoGain.connect(this.filterNode.frequency);

      this.noiseNode.connect(this.filterNode);
      this.filterNode.connect(this.gainNode);
      this.gainNode.connect(this.ctx.destination);

      this.lfoNode.start();
    }

    this.noiseNode.start();
  }

  public stop() {
    this.isPlaying = false;
    this.currentSoundType = 'off';

    try {
      if (this.noiseNode) {
        this.noiseNode.stop();
        this.noiseNode.disconnect();
        this.noiseNode = null;
      }
      if (this.filterNode) {
        this.filterNode.disconnect();
        this.filterNode = null;
      }
      if (this.lfoNode) {
        this.lfoNode.stop();
        this.lfoNode.disconnect();
        this.lfoNode = null;
      }
      if (this.lfoGain) {
        this.lfoGain.disconnect();
        this.lfoGain = null;
      }
      if (this.gainNode) {
        this.gainNode.disconnect();
        this.gainNode = null;
      }
    } catch (e) {
      console.warn('Error stopping ambient audio:', e);
    }
  }

  public toggle(type: 'rain' | 'waves' | 'wind') {
    if (this.isPlaying && this.currentSoundType === type) {
      this.stop();
    } else {
      this.play(type);
    }
  }

  public getStatus() {
    return {
      isPlaying: this.isPlaying,
      type: this.currentSoundType
    };
  }

  // Play a simple cute bubble/chime sound using synthesized frequencies
  public playChime(style: 'complete' | 'break' | 'click' = 'click') {
    this.initContext();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    const now = this.ctx.currentTime;

    if (style === 'complete') {
      // Arpeggio chime: beautiful bubbly tone
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.1); // E5
      osc.frequency.setValueAtTime(783.99, now + 0.2); // G5
      osc.frequency.setValueAtTime(1046.50, now + 0.3); // C6

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.3, now + 0.05);
      gain.gain.setValueAtTime(0.3, now + 0.4);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
      osc.start(now);
      osc.stop(now + 0.8);
    } 
    else if (style === 'break') {
      // Relaxing double bell sound
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440.00, now); // A4
      osc.frequency.setValueAtTime(587.33, now + 0.15); // D5

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.2, now + 0.05);
      gain.gain.setValueAtTime(0.2, now + 0.35);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
      osc.start(now);
      osc.stop(now + 0.7);
    } 
    else {
      // Cute bubble click
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.08);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.09);
    }
  }
}

export const audioSynthesizer = new AmbientSynthesizer();
