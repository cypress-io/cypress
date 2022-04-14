/**
 * Our default hover/focus behavior for buttons and cards is an indigo
 * border that hovers in and out
 * Animations not working? Border looking a little off? Make sure that you
 * have border-1 set on the non-hocus state. If you *don't* want a gray
 * outline with that, do border-transparent for the non-hocus state.
 */

const focusDefault = 'outline-none focus:border focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 focus:outline-transparent transition duration-150 disabled:hover:ring-0 disabled:hover:border-transparent'

// Usually what you want
const hocusDefault = focusDefault.replace(/focus:/g, 'hocus:')

// If you want to control a parent card when an inner button is in focus
const focusWithinDefault = focusDefault.replace(/focus:/g, 'focus-within:')

export const shortcuts = {
  'default-ring': focusDefault.replace(/focus:/g, ''),
  'hocus-within-default': focusDefault.replace(/focus:/g, 'hocus-within:'),
  'hocus-default': hocusDefault,
  'focus-within-default': focusWithinDefault,
  'focus-default': focusDefault,
  'hocus-link-default': 'focus:outline-transparent hocus:underline',
  'hocus-error': hocusDefault.replace(/indigo/g, 'error'),
  'hocus-secondary': hocusDefault.replace(/indigo/g, 'jade'),
}
