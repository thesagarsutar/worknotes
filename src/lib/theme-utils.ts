/**
 * Utility functions for theme-related operations
 */

/**
 * Updates the favicon based on the current theme mode
 * @param theme The current theme ('light', 'dark', or 'auto')
 * @param systemIsDark Boolean indicating if system preference is dark mode (only used when theme is 'auto')
 */
export function updateFavicon(theme: 'light' | 'dark' | 'auto', systemIsDark?: boolean): void {
  // Determine if we should show dark favicon
  let useDarkFavicon: boolean;
  
  if (theme === 'auto') {
    // For auto theme, use system preference
    useDarkFavicon = systemIsDark ?? false;
  } else {
    // Otherwise use explicit theme setting
    useDarkFavicon = theme === 'dark';
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
