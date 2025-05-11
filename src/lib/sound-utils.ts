/**
 * Sound utilities for the application
 * 
 * This module provides functions for generating and playing sound effects
 * throughout the application using the Web Audio API.
 */

// AudioContext singleton
let audioContext: AudioContext | null = null;
let pendingAppRefreshSound = false;

/**
 * Initialize the audio context
 */
function getAudioContext(): AudioContext {
  if (!audioContext) {
    try {
      // Create new audio context
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // If there's a pending app refresh sound, play it now that we have user interaction
      if (pendingAppRefreshSound) {
        pendingAppRefreshSound = false;
        setTimeout(() => generateAppRefreshSound(), 100);
      }
    } catch (error) {
      console.error('Failed to create audio context:', error);
    }
  }
  return audioContext as AudioContext;
}

/**
 * Preload sounds and initialize audio context
 */
export function preloadSounds(): void {
  // Try to initialize on hover (might work in some browsers)
  document.addEventListener('mouseover', () => {
    if (!audioContext) {
      try {
        getAudioContext();
        console.debug('Audio context initialized on hover');
      } catch (error) {
        console.debug('Could not initialize audio context on hover');
      }
    }
  }, { once: true });
  
  // Guaranteed initialization on user click (works in all browsers)
  document.addEventListener('click', () => {
    if (!audioContext) {
      try {
        getAudioContext();
        console.debug('Audio context initialized on click');
      } catch (error) {
        console.debug('Could not initialize audio context on click:', error);
      }
    }
  }, { once: true });
  
  // Also try with keydown events
  document.addEventListener('keydown', () => {
    if (!audioContext) {
      try {
        getAudioContext();
        console.debug('Audio context initialized on keydown');
      } catch (error) {
        console.debug('Could not initialize audio context on keydown');
      }
    }
  }, { once: true });
}

/**
 * Generate a simple beep sound
 * @param frequency The frequency of the sound in Hz
 * @param duration The duration of the sound in ms
 * @param volume The volume of the sound (0.0 to 1.0)
 */
function generateBeep(frequency: number, duration: number, volume: number): void {
  try {
    const context = getAudioContext();
    
    // Create oscillator
    const oscillator = context.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;
    
    // Create gain node for volume control
    const gainNode = context.createGain();
    gainNode.gain.value = volume;
    
    // Connect nodes
    oscillator.connect(gainNode);
    gainNode.connect(context.destination);
    
    // Start and stop the sound
    oscillator.start();
    oscillator.stop(context.currentTime + duration / 1000);
  } catch (error) {
    console.debug('Error generating beep:', error);
  }
}

/**
 * Generate a task add sound effect (higher pitched beep)
 * @param frequency Base frequency for the sound
 * @param volume Volume level (0.0 to 1.0)
 */
function generateTaskAddSound(frequency: number = 600, volume: number = 0.1): void {
  // Create a very short, subtle beep
  generateBeep(frequency, 40, volume);
}

/**
 * Generate a task complete sound effect (two-tone success sound)
 * @param volume Volume level (0.0 to 1.0)
 */
function generateTaskCompleteSound(volume: number = 0.1): void {
  // Create a very subtle two-tone success sound
  setTimeout(() => generateBeep(800, 40, volume), 0);
  setTimeout(() => generateBeep(1000, 60, volume), 40);
}

/**
 * Generate a task uncheck sound effect (reverse of complete sound)
 * @param volume Volume level (0.0 to 1.0)
 */
function generateTaskUncheckSound(volume: number = 0.1): void {
  // Create a very subtle two-tone sound (reverse of complete)
  setTimeout(() => generateBeep(1000, 40, volume), 0);
  setTimeout(() => generateBeep(800, 60, volume), 40);
}

/**
 * Generate a morning refresh sound effect (pleasant chime sequence)
 * @param volume Volume level (0.0 to 1.0)
 */
function generateMorningSound(volume: number = 0.15): void {
  // Create a pleasant morning chime sequence
  const baseVolume = volume * 0.8;
  const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 (C major chord)
  
  // Play each note with slight delay and increasing volume
  notes.forEach((note, index) => {
    setTimeout(() => {
      // Slightly increase volume for each note
      const noteVolume = baseVolume * (0.7 + (index * 0.1));
      generateBeep(note, 80, noteVolume);
    }, index * 100);
  });
}

/**
 * Generate an app refresh sound effect (gentle welcome sound)
 * @param volume Volume level (0.0 to 1.0)
 */
function generateAppRefreshSound(volume: number = 0.12): void {
  // Create a gentle, welcoming sound for app refresh
  // Using a pleasant G major chord (G4, B4, D5, G5) with arpeggiated pattern
  const baseVolume = volume * 0.8;
  const notes = [392.00, 493.88, 587.33, 783.99]; // G4, B4, D5, G5
  
  // Play each note with a gentle fade-in effect
  notes.forEach((note, index) => {
    setTimeout(() => {
      // Create a gentle swell effect with volume
      const noteVolume = baseVolume * (0.6 + (index * 0.1));
      // Slightly longer notes for a more soothing effect
      generateBeep(note, 100, noteVolume);
    }, index * 120); // Slightly longer delay between notes for a more relaxed feel
  });
}

/**
 * Play the task add sound effect
 * @param volume Optional volume level (0.0 to 1.0)
 */
export function playTaskAddSound(volume = 0.1): void {
  // Check if sounds are enabled globally
  if (localStorage.getItem('soundsEnabled') === 'false') return;
  
  // Check if this specific sound is enabled
  if (localStorage.getItem('taskAddSoundEnabled') === 'false') return;
  
  generateTaskAddSound(600, volume);
}

/**
 * Play the task complete sound effect
 * @param volume Optional volume level (0.0 to 1.0)
 */
export function playTaskCompleteSound(volume = 0.1): void {
  // Check if sounds are enabled globally
  if (localStorage.getItem('soundsEnabled') === 'false') return;
  
  // Check if this specific sound is enabled
  if (localStorage.getItem('taskCompleteSoundEnabled') === 'false') return;
  
  generateTaskCompleteSound(volume);
}

/**
 * Play the task uncheck sound effect
 * @param volume Optional volume level (0.0 to 1.0)
 */
export function playTaskUncheckSound(volume = 0.1): void {
  // Check if sounds are enabled globally
  if (localStorage.getItem('soundsEnabled') === 'false') return;
  
  // Check if this specific sound is enabled
  if (localStorage.getItem('taskUncheckSoundEnabled') === 'false') return;
  
  generateTaskUncheckSound(volume);
}

/**
 * Play the morning refresh sound effect
 * @param volume Optional volume level (0.0 to 1.0)
 */
export function playMorningSound(volume = 0.15): void {
  // Check if sounds are enabled globally
  if (localStorage.getItem('soundsEnabled') === 'false') return;
  
  generateMorningSound(volume);
}

/**
 * Play the app refresh sound effect
 * @param volume Optional volume level (0.0 to 1.0)
 */
export function playAppRefreshSound(volume = 0.12): void {
  // Check if sounds are enabled globally
  if (localStorage.getItem('soundsEnabled') === 'false') return;
  
  // If audio context isn't initialized yet, mark as pending and wait for user interaction
  if (!audioContext) {
    pendingAppRefreshSound = true;
    console.debug('App refresh sound pending user interaction');
    return;
  }
  
  generateAppRefreshSound(volume);
}
