/**
 * Utility functions for theme-related operations
 */

// Define theme types
export type ThemeType = 'light' | 'darker' | 'darkest' | 'auto';

/**
 * Updates the favicon based on the current theme mode
 * @param theme The current theme ('light', 'darker', 'darkest', or 'auto')
 * @param systemIsDark Boolean indicating if system preference is dark mode (only used when theme is 'auto')
 */
export function updateFavicon(theme: ThemeType, systemIsDark?: boolean): void {
  // Determine if we should show dark favicon
  let useDarkFavicon: boolean;
  
  if (theme === 'auto') {
    // For auto theme, use system preference
    useDarkFavicon = systemIsDark ?? false;
  } else {
    // Otherwise use explicit theme setting
    useDarkFavicon = theme === 'darker' || theme === 'darkest';
  }
  
  // Get existing favicon element or create one if it doesn't exist
  let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }
  
  // Set the appropriate favicon
  if (useDarkFavicon) {
    link.href = "/lovable-uploads/c84b0b33-aacd-4d9f-94a9-61b43c5e1ce2.png";
  } else {
    link.href = "/lovable-uploads/5ab66b5f-8eb2-4753-9552-ca6a20bf7bfe.png";
  }
}

/**
 * Updates the document theme based on the current theme mode
 * @param theme The current theme ('light', 'darker', 'darkest', or 'auto')
 * @param systemIsDark Boolean indicating if system preference is dark mode (only used when theme is 'auto')
 */
export function updateDocumentTheme(theme: ThemeType, systemIsDark?: boolean): void {
  // Remove all theme classes first
  document.documentElement.classList.remove('light', 'darker', 'darkest');
  
  if (theme === 'auto') {
    // For auto theme, use system preference
    const prefersDark = systemIsDark ?? false;
    if (prefersDark) {
      // Default dark theme is 'darker'
      document.documentElement.classList.add('darker');
    } else {
      document.documentElement.classList.add('light');
    }
  } else {
    // Apply the explicit theme
    document.documentElement.classList.add(theme);
  }
}
