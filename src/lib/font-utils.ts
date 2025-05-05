/**
 * Utility functions for font-related operations
 */

export type FontOption = 'system-ui' | 'ibm-plex-sans' | 'jetbrains-mono';

/**
 * Updates the document font based on the selected font
 * @param font The selected font
 */
export function updateDocumentFont(font: FontOption): void {
  // Remove all existing font classes
  document.documentElement.classList.remove(
    'font-system-ui',
    'font-ibm-plex-sans', 
    'font-jetbrains-mono'
  );
  
  // Add the selected font class
  document.documentElement.classList.add(`font-${font}`);
  
  // Apply the font directly to the document body as a fallback
  if (font === 'system-ui') {
    document.body.style.fontFamily = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    document.body.style.fontWeight = 'normal';
  } else if (font === 'ibm-plex-sans') {
    // Use IBM Plex Sans with proper weight
    document.body.style.fontFamily = '"IBM Plex Sans", system-ui, sans-serif';
    document.body.style.fontWeight = '300'; // Lighter weight for better readability
  } else if (font === 'jetbrains-mono') {
    // Use JetBrains Mono with proper weight
    document.body.style.fontFamily = '"JetBrains Mono", monospace';
    document.body.style.fontWeight = '300'; // Lighter weight for better readability
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
  
  if (storedFont === 'system-ui' || storedFont === 'ibm-plex-sans' || storedFont === 'jetbrains-mono') {
    return storedFont as FontOption;
  }
  
  // Default to system-ui if no valid font is stored
  return 'system-ui';
}
