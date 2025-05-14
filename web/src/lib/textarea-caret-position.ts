/**
 * textarea-caret-position
 * Adapted from: https://github.com/component/textarea-caret-position
 * 
 * Get the position of a textarea or input's caret in pixels
 */

interface CaretCoordinates {
  top: number;
  left: number;
  height: number;
}

export function getCaretCoordinates(element: HTMLTextAreaElement | HTMLInputElement, position: number): CaretCoordinates {
  // The properties we are copying to the div
  const properties = [
    'direction',
    'boxSizing',
    'width',
    'height',
    'overflowX',
    'overflowY',
    'borderTopWidth',
    'borderRightWidth',
    'borderBottomWidth',
    'borderLeftWidth',
    'borderStyle',
    'paddingTop',
    'paddingRight',
    'paddingBottom',
    'paddingLeft',
    'fontStyle',
    'fontVariant',
    'fontWeight',
    'fontStretch',
    'fontSize',
    'fontSizeAdjust',
    'lineHeight',
    'fontFamily',
    'textAlign',
    'textTransform',
    'textIndent',
    'textDecoration',
    'letterSpacing',
    'wordSpacing',
    'tabSize',
    'MozTabSize'
  ];

  // We'll create a div that mimics the textarea's style and content
  const div = document.createElement('div');
  div.id = 'input-textarea-caret-position-mirror-div';
  document.body.appendChild(div);

  const style = div.style;
  // Use getComputedStyle for all browsers (currentStyle was for old IE)
  const computed = window.getComputedStyle(element);

  // Default textarea styles
  style.whiteSpace = 'pre-wrap';
  style.wordWrap = 'break-word'; // Only for textarea-s

  // Position off-screen
  style.position = 'absolute';
  style.visibility = 'hidden';

  // Transfer the element's properties to the div
  properties.forEach(function(prop) {
    style[prop as any] = computed[prop];
  });

  // Firefox adds 2 pixels to the padding - https://bugzilla.mozilla.org/show_bug.cgi?id=753662
  if (window.navigator.userAgent.toLowerCase().indexOf('firefox') !== -1) {
    style.width = `${parseInt(computed.width as string) - 2}px`;
    if (element.scrollHeight > parseInt(computed.height as string))
      style.overflowY = 'scroll';
  } else {
    style.overflow = 'hidden'; // for Chrome to not render a scrollbar
  }

  div.textContent = element.value.substring(0, position);
  
  // Create a span at the caret position
  const span = document.createElement('span');
  span.textContent = element.value.substring(position) || '.'; // Ensure span has dimensions
  div.appendChild(span);

  const coordinates = {
    top: span.offsetTop + parseInt(computed.borderTopWidth as string),
    left: span.offsetLeft + parseInt(computed.borderLeftWidth as string),
    height: parseInt(computed.lineHeight as string)
  };

  document.body.removeChild(div);

  return coordinates;
}
