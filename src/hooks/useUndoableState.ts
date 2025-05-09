import { useState, useCallback } from 'react';

/**
 * A custom hook that provides undo and redo functionality for a state value
 * @param initialValue The initial state value
 * @param maxHistorySize Maximum number of history states to keep (default: 100)
 * @returns An object containing the current state, setter, undo and redo functions, and can-undo/can-redo flags
 */
export function useUndoableState<T>(initialValue: T, maxHistorySize: number = 100) {
  // Current state value
  const [value, setValue] = useState<T>(initialValue);
  
  // History of past values (for undo)
  const [past, setPast] = useState<T[]>([]);
  
  // History of future values (for redo)
  const [future, setFuture] = useState<T[]>([]);

  /**
   * Update the state value and add the previous value to the history
   * @param newValue The new state value
   */
  const updateValue = useCallback((newValue: T) => {
    // Don't record if the value hasn't changed
    if (JSON.stringify(newValue) === JSON.stringify(value)) {
      return;
    }
    
    // Add current value to past
    setPast(prev => {
      const newPast = [...prev, value];
      // Limit the history size
      if (newPast.length > maxHistorySize) {
        return newPast.slice(newPast.length - maxHistorySize);
      }
      return newPast;
    });
    
    // Clear future since we're creating a new timeline
    setFuture([]);
    
    // Update the current value
    setValue(newValue);
  }, [value, maxHistorySize]);

  /**
   * Undo the last change
   */
  const undo = useCallback(() => {
    if (past.length === 0) return;
    
    // Get the last value from past
    const previous = past[past.length - 1];
    
    // Remove it from past
    setPast(prev => prev.slice(0, prev.length - 1));
    
    // Add current value to future
    setFuture(prev => [value, ...prev]);
    
    // Set the value to the previous one
    setValue(previous);
  }, [past, value]);

  /**
   * Redo the last undone change
   */
  const redo = useCallback(() => {
    if (future.length === 0) return;
    
    // Get the first value from future
    const next = future[0];
    
    // Remove it from future
    setFuture(prev => prev.slice(1));
    
    // Add current value to past
    setPast(prev => [...prev, value]);
    
    // Set the value to the next one
    setValue(next);
  }, [future, value]);

  /**
   * Clear all history
   */
  const clearHistory = useCallback(() => {
    setPast([]);
    setFuture([]);
  }, []);

  return {
    value,
    setValue: updateValue,
    undo,
    redo,
    clearHistory,
    canUndo: past.length > 0,
    canRedo: future.length > 0
  };
}
