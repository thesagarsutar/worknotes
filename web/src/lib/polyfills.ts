// Polyfill for the global variable needed by some Node.js packages in the browser
if (typeof window !== 'undefined' && typeof window.global === 'undefined') {
  // @ts-ignore
  window.global = window;
}
