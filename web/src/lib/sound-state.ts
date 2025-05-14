/**
 * Sound state management
 * 
 * This module provides a simple state management system for coordinating
 * sounds across different components.
 */

// Track if a carryforward sound has played in this session
let hasCarryforwardSoundPlayed = false;

/**
 * Set the carryforward sound played state
 * @param played Whether the carryforward sound has played
 */
export function setCarryforwardSoundPlayed(played: boolean): void {
  hasCarryforwardSoundPlayed = played;
}

/**
 * Check if the carryforward sound has played
 * @returns Boolean indicating if the carryforward sound has played
 */
export function hasCarryforwardPlayed(): boolean {
  return hasCarryforwardSoundPlayed;
}

/**
 * Reset all sound states
 */
export function resetSoundStates(): void {
  hasCarryforwardSoundPlayed = false;
}
