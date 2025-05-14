/**
 * Utility functions for font-related operations
 */

export type FontOption = 'system-ui' | 'geist' | 'jetbrains-mono' | 'geist-mono';

/**
 * Updates the document font based on the selected font
 * @param font The selected font
 */
export function updateDocumentFont(font: FontOption): void {
  // Remove all existing font classes
  document.documentElement.classList.remove(
    'font-system-ui',
    'font-geist', 
    'font-jetbrains-mono',
    'font-geist-mono'
  );
  
  // Add the selected font class
  document.documentElement.classList.add(`font-${font}`);
  
  // Apply the font directly to the document body as a fallback
  if (font === 'system-ui') {
    document.body.style.fontFamily = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    document.body.style.fontWeight = 'normal';
  } else if (font === 'geist') {
    // Use Geist with proper weight
    document.body.style.fontFamily = '"Geist", system-ui, sans-serif';
    document.body.style.fontWeight = '300'; // Lighter weight for better readability
  } else if (font === 'jetbrains-mono') {
    // Use JetBrains Mono with proper weight
    document.body.style.fontFamily = '"JetBrains Mono", monospace';
    document.body.style.fontWeight = '400';
  } else if (font === 'geist-mono') {
    // Use Geist Mono with proper weight
    document.body.style.fontFamily = '"Geist Mono", monospace';
    document.body.style.fontWeight = '400';
  }
  
  // Store the font preference
  localStorage.setItem("font", font);
}

/**
 * Gets the current font from localStorage or returns the default font
 * @returns The current font
 */
export function getCurrentFont(): FontOption {
  const storedFont = localStorage.getItem('font');
  
  if (storedFont === 'system-ui' || storedFont === 'geist' || storedFont === 'jetbrains-mono' || storedFont === 'geist-mono') {
    return storedFont as FontOption;
  }
  
  // Default to jetbrains-mono if no valid font is stored
  return 'jetbrains-mono';
}
