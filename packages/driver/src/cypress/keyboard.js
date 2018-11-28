/* eslint-disable
    default-case,
    no-case-declarations,
    no-unused-vars,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const _ = require('lodash')
const Promise = require('bluebird')
const $elements = require('../dom/elements')
const $selection = require('../dom/selection')
const $Cypress = require('../cypress')
const $native = require('../cypress/native_events')

const isSingleDigitRe = /^\d$/
const isStartingDigitRe = /^\d/
const charsBetweenCurlyBracesRe = /({.+?})/

const keyboardMappings = {
  '0': { 'keyCode': 48, 'key': '0', 'code': 'Digit0' },
  '1': { 'keyCode': 49, 'key': '1', 'code': 'Digit1' },
  '2': { 'keyCode': 50, 'key': '2', 'code': 'Digit2' },
  '3': { 'keyCode': 51, 'key': '3', 'code': 'Digit3' },
  '4': { 'keyCode': 52, 'key': '4', 'code': 'Digit4' },
  '5': { 'keyCode': 53, 'key': '5', 'code': 'Digit5' },
  '6': { 'keyCode': 54, 'key': '6', 'code': 'Digit6' },
  '7': { 'keyCode': 55, 'key': '7', 'code': 'Digit7' },
  '8': { 'keyCode': 56, 'key': '8', 'code': 'Digit8' },
  '9': { 'keyCode': 57, 'key': '9', 'code': 'Digit9' },
  'Power': { 'key': 'Power', 'code': 'Power' },
  'Eject': { 'key': 'Eject', 'code': 'Eject' },
  'Abort': { 'keyCode': 3, 'code': 'Abort', 'key': 'Cancel' },
  'Help': { 'keyCode': 6, 'code': 'Help', 'key': 'Help' },
  'Backspace': { 'keyCode': 8, 'code': 'Backspace', 'key': 'Backspace' },
  'Tab': { 'keyCode': 9, 'code': 'Tab', 'key': 'Tab' },
  'Numpad5': { 'keyCode': 12, 'shiftKeyCode': 101, 'key': 'Clear', 'code': 'Numpad5', 'shiftKey': '5', 'location': 3 },
  'NumpadEnter': { 'keyCode': 13, 'code': 'NumpadEnter', 'key': 'Enter', 'text': '\r', 'location': 3 },
  'Enter': { 'keyCode': 13, 'code': 'Enter', 'key': 'Enter', 'text': '\r' },
  '\r': { 'keyCode': 13, 'code': 'Enter', 'key': 'Enter', 'text': '\r' },
  '\n': { 'keyCode': 13, 'code': 'Enter', 'key': 'Enter', 'text': '\r' },
  'ShiftLeft': { 'keyCode': 16, 'code': 'ShiftLeft', 'key': 'Shift', 'location': 1 },
  'ShiftRight': { 'keyCode': 16, 'code': 'ShiftRight', 'key': 'Shift', 'location': 2 },
  'ControlLeft': { 'keyCode': 17, 'code': 'ControlLeft', 'key': 'Control', 'location': 1 },
  'ControlRight': { 'keyCode': 17, 'code': 'ControlRight', 'key': 'Control', 'location': 2 },
  'AltLeft': { 'keyCode': 18, 'code': 'AltLeft', 'key': 'Alt', 'location': 1 },
  'AltRight': { 'keyCode': 18, 'code': 'AltRight', 'key': 'Alt', 'location': 2 },
  'Pause': { 'keyCode': 19, 'code': 'Pause', 'key': 'Pause' },
  'CapsLock': { 'keyCode': 20, 'code': 'CapsLock', 'key': 'CapsLock' },
  'Escape': { 'keyCode': 27, 'code': 'Escape', 'key': 'Escape' },
  'Convert': { 'keyCode': 28, 'code': 'Convert', 'key': 'Convert' },
  'NonConvert': { 'keyCode': 29, 'code': 'NonConvert', 'key': 'NonConvert' },
  'Space': { 'keyCode': 32, 'code': 'Space', 'key': ' ' },
  'Numpad9': { 'keyCode': 33, 'shiftKeyCode': 105, 'key': 'PageUp', 'code': 'Numpad9', 'shiftKey': '9', 'location': 3 },
  'PageUp': { 'keyCode': 33, 'code': 'PageUp', 'key': 'PageUp' },
  'Numpad3': { 'keyCode': 34, 'shiftKeyCode': 99, 'key': 'PageDown', 'code': 'Numpad3', 'shiftKey': '3', 'location': 3 },
  'PageDown': { 'keyCode': 34, 'code': 'PageDown', 'key': 'PageDown' },
  'End': { 'keyCode': 35, 'code': 'End', 'key': 'End' },
  'Numpad1': { 'keyCode': 35, 'shiftKeyCode': 97, 'key': 'End', 'code': 'Numpad1', 'shiftKey': '1', 'location': 3 },
  'Home': { 'keyCode': 36, 'code': 'Home', 'key': 'Home' },
  'Numpad7': { 'keyCode': 36, 'shiftKeyCode': 103, 'key': 'Home', 'code': 'Numpad7', 'shiftKey': '7', 'location': 3 },
  'ArrowLeft': { 'keyCode': 37, 'code': 'ArrowLeft', 'key': 'ArrowLeft' },
  'Numpad4': { 'keyCode': 37, 'shiftKeyCode': 100, 'key': 'ArrowLeft', 'code': 'Numpad4', 'shiftKey': '4', 'location': 3 },
  'Numpad8': { 'keyCode': 38, 'shiftKeyCode': 104, 'key': 'ArrowUp', 'code': 'Numpad8', 'shiftKey': '8', 'location': 3 },
  'ArrowUp': { 'keyCode': 38, 'code': 'ArrowUp', 'key': 'ArrowUp' },
  'ArrowRight': { 'keyCode': 39, 'code': 'ArrowRight', 'key': 'ArrowRight' },
  'Numpad6': { 'keyCode': 39, 'shiftKeyCode': 102, 'key': 'ArrowRight', 'code': 'Numpad6', 'shiftKey': '6', 'location': 3 },
  'Numpad2': { 'keyCode': 40, 'shiftKeyCode': 98, 'key': 'ArrowDown', 'code': 'Numpad2', 'shiftKey': '2', 'location': 3 },
  'ArrowDown': { 'keyCode': 40, 'code': 'ArrowDown', 'key': 'ArrowDown' },
  'Select': { 'keyCode': 41, 'code': 'Select', 'key': 'Select' },
  'Open': { 'keyCode': 43, 'code': 'Open', 'key': 'Execute' },
  'PrintScreen': { 'keyCode': 44, 'code': 'PrintScreen', 'key': 'PrintScreen' },
  'Insert': { 'keyCode': 45, 'code': 'Insert', 'key': 'Insert' },
  'Numpad0': { 'keyCode': 45, 'shiftKeyCode': 96, 'key': 'Insert', 'code': 'Numpad0', 'shiftKey': '0', 'location': 3 },
  'Delete': { 'keyCode': 46, 'code': 'Delete', 'key': 'Delete' },
  'NumpadDecimal': { 'keyCode': 46, 'shiftKeyCode': 110, 'code': 'NumpadDecimal', 'key': '\u0000', 'shiftKey': '.', 'location': 3 },
  'Digit0': { 'keyCode': 48, 'code': 'Digit0', 'shiftKey': ')', 'key': '0' },
  'Digit1': { 'keyCode': 49, 'code': 'Digit1', 'shiftKey': '!', 'key': '1' },
  'Digit2': { 'keyCode': 50, 'code': 'Digit2', 'shiftKey': '@', 'key': '2' },
  'Digit3': { 'keyCode': 51, 'code': 'Digit3', 'shiftKey': '#', 'key': '3' },
  'Digit4': { 'keyCode': 52, 'code': 'Digit4', 'shiftKey': '$', 'key': '4' },
  'Digit5': { 'keyCode': 53, 'code': 'Digit5', 'shiftKey': '%', 'key': '5' },
  'Digit6': { 'keyCode': 54, 'code': 'Digit6', 'shiftKey': '^', 'key': '6' },
  'Digit7': { 'keyCode': 55, 'code': 'Digit7', 'shiftKey': '&', 'key': '7' },
  'Digit8': { 'keyCode': 56, 'code': 'Digit8', 'shiftKey': '*', 'key': '8' },
  'Digit9': { 'keyCode': 57, 'code': 'Digit9', 'shiftKey': '\(', 'key': '9' },
  'KeyA': { 'keyCode': 65, 'code': 'KeyA', 'shiftKey': 'A', 'key': 'a' },
  'KeyB': { 'keyCode': 66, 'code': 'KeyB', 'shiftKey': 'B', 'key': 'b' },
  'KeyC': { 'keyCode': 67, 'code': 'KeyC', 'shiftKey': 'C', 'key': 'c' },
  'KeyD': { 'keyCode': 68, 'code': 'KeyD', 'shiftKey': 'D', 'key': 'd' },
  'KeyE': { 'keyCode': 69, 'code': 'KeyE', 'shiftKey': 'E', 'key': 'e' },
  'KeyF': { 'keyCode': 70, 'code': 'KeyF', 'shiftKey': 'F', 'key': 'f' },
  'KeyG': { 'keyCode': 71, 'code': 'KeyG', 'shiftKey': 'G', 'key': 'g' },
  'KeyH': { 'keyCode': 72, 'code': 'KeyH', 'shiftKey': 'H', 'key': 'h' },
  'KeyI': { 'keyCode': 73, 'code': 'KeyI', 'shiftKey': 'I', 'key': 'i' },
  'KeyJ': { 'keyCode': 74, 'code': 'KeyJ', 'shiftKey': 'J', 'key': 'j' },
  'KeyK': { 'keyCode': 75, 'code': 'KeyK', 'shiftKey': 'K', 'key': 'k' },
  'KeyL': { 'keyCode': 76, 'code': 'KeyL', 'shiftKey': 'L', 'key': 'l' },
  'KeyM': { 'keyCode': 77, 'code': 'KeyM', 'shiftKey': 'M', 'key': 'm' },
  'KeyN': { 'keyCode': 78, 'code': 'KeyN', 'shiftKey': 'N', 'key': 'n' },
  'KeyO': { 'keyCode': 79, 'code': 'KeyO', 'shiftKey': 'O', 'key': 'o' },
  'KeyP': { 'keyCode': 80, 'code': 'KeyP', 'shiftKey': 'P', 'key': 'p' },
  'KeyQ': { 'keyCode': 81, 'code': 'KeyQ', 'shiftKey': 'Q', 'key': 'q' },
  'KeyR': { 'keyCode': 82, 'code': 'KeyR', 'shiftKey': 'R', 'key': 'r' },
  'KeyS': { 'keyCode': 83, 'code': 'KeyS', 'shiftKey': 'S', 'key': 's' },
  'KeyT': { 'keyCode': 84, 'code': 'KeyT', 'shiftKey': 'T', 'key': 't' },
  'KeyU': { 'keyCode': 85, 'code': 'KeyU', 'shiftKey': 'U', 'key': 'u' },
  'KeyV': { 'keyCode': 86, 'code': 'KeyV', 'shiftKey': 'V', 'key': 'v' },
  'KeyW': { 'keyCode': 87, 'code': 'KeyW', 'shiftKey': 'W', 'key': 'w' },
  'KeyX': { 'keyCode': 88, 'code': 'KeyX', 'shiftKey': 'X', 'key': 'x' },
  'KeyY': { 'keyCode': 89, 'code': 'KeyY', 'shiftKey': 'Y', 'key': 'y' },
  'KeyZ': { 'keyCode': 90, 'code': 'KeyZ', 'shiftKey': 'Z', 'key': 'z' },
  'MetaLeft': { 'keyCode': 91, 'code': 'MetaLeft', 'key': 'Meta', 'location': 1 },
  'MetaRight': { 'keyCode': 92, 'code': 'MetaRight', 'key': 'Meta', 'location': 2 },
  'ContextMenu': { 'keyCode': 93, 'code': 'ContextMenu', 'key': 'ContextMenu' },
  'NumpadMultiply': { 'keyCode': 106, 'code': 'NumpadMultiply', 'key': '*', 'location': 3 },
  'NumpadAdd': { 'keyCode': 107, 'code': 'NumpadAdd', 'key': '+', 'location': 3 },
  'NumpadSubtract': { 'keyCode': 109, 'code': 'NumpadSubtract', 'key': '-', 'location': 3 },
  'NumpadDivide': { 'keyCode': 111, 'code': 'NumpadDivide', 'key': '/', 'location': 3 },
  'F1': { 'keyCode': 112, 'code': 'F1', 'key': 'F1' },
  'F2': { 'keyCode': 113, 'code': 'F2', 'key': 'F2' },
  'F3': { 'keyCode': 114, 'code': 'F3', 'key': 'F3' },
  'F4': { 'keyCode': 115, 'code': 'F4', 'key': 'F4' },
  'F5': { 'keyCode': 116, 'code': 'F5', 'key': 'F5' },
  'F6': { 'keyCode': 117, 'code': 'F6', 'key': 'F6' },
  'F7': { 'keyCode': 118, 'code': 'F7', 'key': 'F7' },
  'F8': { 'keyCode': 119, 'code': 'F8', 'key': 'F8' },
  'F9': { 'keyCode': 120, 'code': 'F9', 'key': 'F9' },
  'F10': { 'keyCode': 121, 'code': 'F10', 'key': 'F10' },
  'F11': { 'keyCode': 122, 'code': 'F11', 'key': 'F11' },
  'F12': { 'keyCode': 123, 'code': 'F12', 'key': 'F12' },
  'F13': { 'keyCode': 124, 'code': 'F13', 'key': 'F13' },
  'F14': { 'keyCode': 125, 'code': 'F14', 'key': 'F14' },
  'F15': { 'keyCode': 126, 'code': 'F15', 'key': 'F15' },
  'F16': { 'keyCode': 127, 'code': 'F16', 'key': 'F16' },
  'F17': { 'keyCode': 128, 'code': 'F17', 'key': 'F17' },
  'F18': { 'keyCode': 129, 'code': 'F18', 'key': 'F18' },
  'F19': { 'keyCode': 130, 'code': 'F19', 'key': 'F19' },
  'F20': { 'keyCode': 131, 'code': 'F20', 'key': 'F20' },
  'F21': { 'keyCode': 132, 'code': 'F21', 'key': 'F21' },
  'F22': { 'keyCode': 133, 'code': 'F22', 'key': 'F22' },
  'F23': { 'keyCode': 134, 'code': 'F23', 'key': 'F23' },
  'F24': { 'keyCode': 135, 'code': 'F24', 'key': 'F24' },
  'NumLock': { 'keyCode': 144, 'code': 'NumLock', 'key': 'NumLock' },
  'ScrollLock': { 'keyCode': 145, 'code': 'ScrollLock', 'key': 'ScrollLock' },
  'AudioVolumeMute': { 'keyCode': 173, 'code': 'AudioVolumeMute', 'key': 'AudioVolumeMute' },
  'AudioVolumeDown': { 'keyCode': 174, 'code': 'AudioVolumeDown', 'key': 'AudioVolumeDown' },
  'AudioVolumeUp': { 'keyCode': 175, 'code': 'AudioVolumeUp', 'key': 'AudioVolumeUp' },
  'MediaTrackNext': { 'keyCode': 176, 'code': 'MediaTrackNext', 'key': 'MediaTrackNext' },
  'MediaTrackPrevious': { 'keyCode': 177, 'code': 'MediaTrackPrevious', 'key': 'MediaTrackPrevious' },
  'MediaStop': { 'keyCode': 178, 'code': 'MediaStop', 'key': 'MediaStop' },
  'MediaPlayPause': { 'keyCode': 179, 'code': 'MediaPlayPause', 'key': 'MediaPlayPause' },
  'Semicolon': { 'keyCode': 186, 'code': 'Semicolon', 'shiftKey': ':', 'key': ';' },
  'Equal': { 'keyCode': 187, 'code': 'Equal', 'shiftKey': '+', 'key': '=' },
  'NumpadEqual': { 'keyCode': 187, 'code': 'NumpadEqual', 'key': '=', 'location': 3 },
  'Comma': { 'keyCode': 188, 'code': 'Comma', 'shiftKey': '\<', 'key': ',' },
  'Minus': { 'keyCode': 189, 'code': 'Minus', 'shiftKey': '_', 'key': '-' },
  'Period': { 'keyCode': 190, 'code': 'Period', 'shiftKey': '>', 'key': '.' },
  'Slash': { 'keyCode': 191, 'code': 'Slash', 'shiftKey': '?', 'key': '/' },
  'Backquote': { 'keyCode': 192, 'code': 'Backquote', 'shiftKey': '~', 'key': '`' },
  'BracketLeft': { 'keyCode': 219, 'code': 'BracketLeft', 'shiftKey': '{', 'key': '[' },
  'Backslash': { 'keyCode': 220, 'code': 'Backslash', 'shiftKey': '|', 'key': '\\' },
  'BracketRight': { 'keyCode': 221, 'code': 'BracketRight', 'shiftKey': '}', 'key': ']' },
  'Quote': { 'keyCode': 222, 'code': 'Quote', 'shiftKey': '"', 'key': '\'' },
  'AltGraph': { 'keyCode': 225, 'code': 'AltGraph', 'key': 'AltGraph' },
  'Props': { 'keyCode': 247, 'code': 'Props', 'key': 'CrSel' },
  'Cancel': { 'keyCode': 3, 'key': 'Cancel', 'code': 'Abort' },
  'Clear': { 'keyCode': 12, 'key': 'Clear', 'code': 'Numpad5', 'location': 3 },
  'Shift': { 'keyCode': 16, 'key': 'Shift', 'code': 'ShiftLeft', 'location': 1 },
  'Control': { 'keyCode': 17, 'key': 'Control', 'code': 'ControlLeft', 'location': 1 },
  'Alt': { 'keyCode': 18, 'key': 'Alt', 'code': 'AltLeft', 'location': 1 },
  'Accept': { 'keyCode': 30, 'key': 'Accept' },
  'ModeChange': { 'keyCode': 31, 'key': 'ModeChange' },
  ' ': { 'keyCode': 32, 'key': ' ', 'code': 'Space' },
  'Print': { 'keyCode': 42, 'key': 'Print' },
  'Execute': { 'keyCode': 43, 'key': 'Execute', 'code': 'Open' },
  '\u0000': { 'keyCode': 46, 'key': '\u0000', 'code': 'NumpadDecimal', 'location': 3 },
  'a': { 'keyCode': 65, 'key': 'a', 'code': 'KeyA' },
  'b': { 'keyCode': 66, 'key': 'b', 'code': 'KeyB' },
  'c': { 'keyCode': 67, 'key': 'c', 'code': 'KeyC' },
  'd': { 'keyCode': 68, 'key': 'd', 'code': 'KeyD' },
  'e': { 'keyCode': 69, 'key': 'e', 'code': 'KeyE' },
  'f': { 'keyCode': 70, 'key': 'f', 'code': 'KeyF' },
  'g': { 'keyCode': 71, 'key': 'g', 'code': 'KeyG' },
  'h': { 'keyCode': 72, 'key': 'h', 'code': 'KeyH' },
  'i': { 'keyCode': 73, 'key': 'i', 'code': 'KeyI' },
  'j': { 'keyCode': 74, 'key': 'j', 'code': 'KeyJ' },
  'k': { 'keyCode': 75, 'key': 'k', 'code': 'KeyK' },
  'l': { 'keyCode': 76, 'key': 'l', 'code': 'KeyL' },
  'm': { 'keyCode': 77, 'key': 'm', 'code': 'KeyM' },
  'n': { 'keyCode': 78, 'key': 'n', 'code': 'KeyN' },
  'o': { 'keyCode': 79, 'key': 'o', 'code': 'KeyO' },
  'p': { 'keyCode': 80, 'key': 'p', 'code': 'KeyP' },
  'q': { 'keyCode': 81, 'key': 'q', 'code': 'KeyQ' },
  'r': { 'keyCode': 82, 'key': 'r', 'code': 'KeyR' },
  's': { 'keyCode': 83, 'key': 's', 'code': 'KeyS' },
  't': { 'keyCode': 84, 'key': 't', 'code': 'KeyT' },
  'u': { 'keyCode': 85, 'key': 'u', 'code': 'KeyU' },
  'v': { 'keyCode': 86, 'key': 'v', 'code': 'KeyV' },
  'w': { 'keyCode': 87, 'key': 'w', 'code': 'KeyW' },
  'x': { 'keyCode': 88, 'key': 'x', 'code': 'KeyX' },
  'y': { 'keyCode': 89, 'key': 'y', 'code': 'KeyY' },
  'z': { 'keyCode': 90, 'key': 'z', 'code': 'KeyZ' },
  'Meta': { 'keyCode': 91, 'key': 'Meta', 'code': 'MetaLeft', 'location': 1 },
  '*': { 'keyCode': 106, 'key': '*', 'code': 'NumpadMultiply', 'location': 3 },
  '+': { 'keyCode': 107, 'key': '+', 'code': 'NumpadAdd', 'location': 3 },
  '-': { 'keyCode': 109, 'key': '-', 'code': 'NumpadSubtract', 'location': 3 },
  '/': { 'keyCode': 111, 'key': '/', 'code': 'NumpadDivide', 'location': 3 },
  ';': { 'keyCode': 186, 'key': ';', 'code': 'Semicolon' },
  '=': { 'keyCode': 187, 'key': '=', 'code': 'Equal' },
  ',': { 'keyCode': 188, 'key': ',', 'code': 'Comma' },
  '.': { 'keyCode': 190, 'key': '.', 'code': 'Period' },
  '`': { 'keyCode': 192, 'key': '`', 'code': 'Backquote' },
  '[': { 'keyCode': 219, 'key': '[', 'code': 'BracketLeft' },
  '\\': { 'keyCode': 220, 'key': '\\', 'code': 'Backslash' },
  ']': { 'keyCode': 221, 'key': ']', 'code': 'BracketRight' },
  '\'': { 'keyCode': 222, 'key': '\'', 'code': 'Quote' },
  'Attn': { 'keyCode': 246, 'key': 'Attn' },
  'CrSel': { 'keyCode': 247, 'key': 'CrSel', 'code': 'Props' },
  'ExSel': { 'keyCode': 248, 'key': 'ExSel' },
  'EraseEof': { 'keyCode': 249, 'key': 'EraseEof' },
  'Play': { 'keyCode': 250, 'key': 'Play' },
  'ZoomOut': { 'keyCode': 251, 'key': 'ZoomOut' },
  ')': { 'keyCode': 48, 'key': ')', 'code': 'Digit0' },
  '!': { 'keyCode': 49, 'key': '!', 'code': 'Digit1' },
  '@': { 'keyCode': 50, 'key': '@', 'code': 'Digit2' },
  '#': { 'keyCode': 51, 'key': '#', 'code': 'Digit3' },
  '$': { 'keyCode': 52, 'key': '$', 'code': 'Digit4' },
  '%': { 'keyCode': 53, 'key': '%', 'code': 'Digit5' },
  '^': { 'keyCode': 54, 'key': '^', 'code': 'Digit6' },
  '&': { 'keyCode': 55, 'key': '&', 'code': 'Digit7' },
  '(': { 'keyCode': 57, 'key': '\(', 'code': 'Digit9' },
  'A': { 'keyCode': 65, 'key': 'A', 'code': 'KeyA' },
  'B': { 'keyCode': 66, 'key': 'B', 'code': 'KeyB' },
  'C': { 'keyCode': 67, 'key': 'C', 'code': 'KeyC' },
  'D': { 'keyCode': 68, 'key': 'D', 'code': 'KeyD' },
  'E': { 'keyCode': 69, 'key': 'E', 'code': 'KeyE' },
  'F': { 'keyCode': 70, 'key': 'F', 'code': 'KeyF' },
  'G': { 'keyCode': 71, 'key': 'G', 'code': 'KeyG' },
  'H': { 'keyCode': 72, 'key': 'H', 'code': 'KeyH' },
  'I': { 'keyCode': 73, 'key': 'I', 'code': 'KeyI' },
  'J': { 'keyCode': 74, 'key': 'J', 'code': 'KeyJ' },
  'K': { 'keyCode': 75, 'key': 'K', 'code': 'KeyK' },
  'L': { 'keyCode': 76, 'key': 'L', 'code': 'KeyL' },
  'M': { 'keyCode': 77, 'key': 'M', 'code': 'KeyM' },
  'N': { 'keyCode': 78, 'key': 'N', 'code': 'KeyN' },
  'O': { 'keyCode': 79, 'key': 'O', 'code': 'KeyO' },
  'P': { 'keyCode': 80, 'key': 'P', 'code': 'KeyP' },
  'Q': { 'keyCode': 81, 'key': 'Q', 'code': 'KeyQ' },
  'R': { 'keyCode': 82, 'key': 'R', 'code': 'KeyR' },
  'S': { 'keyCode': 83, 'key': 'S', 'code': 'KeyS' },
  'T': { 'keyCode': 84, 'key': 'T', 'code': 'KeyT' },
  'U': { 'keyCode': 85, 'key': 'U', 'code': 'KeyU' },
  'V': { 'keyCode': 86, 'key': 'V', 'code': 'KeyV' },
  'W': { 'keyCode': 87, 'key': 'W', 'code': 'KeyW' },
  'X': { 'keyCode': 88, 'key': 'X', 'code': 'KeyX' },
  'Y': { 'keyCode': 89, 'key': 'Y', 'code': 'KeyY' },
  'Z': { 'keyCode': 90, 'key': 'Z', 'code': 'KeyZ' },
  ':': { 'keyCode': 186, 'key': ':', 'code': 'Semicolon' },
  '<': { 'keyCode': 188, 'key': '\<', 'code': 'Comma' },
  '_': { 'keyCode': 189, 'key': '_', 'code': 'Minus' },
  '>': { 'keyCode': 190, 'key': '>', 'code': 'Period' },
  '?': { 'keyCode': 191, 'key': '?', 'code': 'Slash' },
  '~': { 'keyCode': 192, 'key': '~', 'code': 'Backquote' },
  '{': { 'keyCode': 219, 'key': '{', 'code': 'BracketLeft' },
  '|': { 'keyCode': 220, 'key': '|', 'code': 'Backslash' },
  '}': { 'keyCode': 221, 'key': '}', 'code': 'BracketRight' },
  '"': { 'keyCode': 222, 'key': '"', 'code': 'Quote' },
}

const getKeyInfo = function (keyString) {
  const keyInfo = keyboardMappings[keyString]

  if (keyInfo.key && (keyInfo.key.length === 1)) {
    keyInfo.text = keyInfo.key
  }

  return keyInfo
}

// Keyboard event map
// https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key/Key_Values
const keyStandardMap = {
  // Cypress keyboard key : Standard value
  '{backspace}': 'Backspace',
  '{del}': 'Delete',
  '{downarrow}': 'ArrowDown',
  '{enter}': 'Enter',
  '{esc}': 'Escape',
  '{leftarrow}': 'ArrowLeft',
  '{rightarrow}': 'ArrowRight',
  '{uparrow}': 'ArrowUp',
  '{alt}': 'Alt',
  '{ctrl}': 'Control',
  '{meta}': 'Meta',
  '{shift}': 'Shift',
}

const $Keyboard = {
  keyToStandard (key) {
    return keyStandardMap[key] || key
  },

  charCodeMap: {
    33: 49, //# ! --- 1
    64: 50, //# @ --- 2
    35: 51, //# # --- 3
    36: 52, //# $ --- 4
    37: 53, //# % --- 5
    94: 54, //# ^ --- 6
    38: 55, //# & --- 7
    42: 56, //# * --- 8
    40: 57, //# ( --- 9
    41: 48, //# ) --- 0
    59: 186, //# ; --- 186
    58: 186, //# : --- 186
    61: 187, //# = --- 187
    43: 187, //# + --- 187
    44: 188, //# , --- 188
    60: 188, //# < --- 188
    45: 189, //# - --- 189
    95: 189, //# _ --- 189
    46: 190, //# . --- 190
    62: 190, //# > --- 190
    47: 191, //# / --- 191
    63: 191, //# ? --- 191
    96: 192, //# ` --- 192
    126: 192, //# ~ --- 192
    91: 219, //# [ --- 219
    123: 219, //# { --- 219
    92: 220, //# \ --- 220
    124: 220, //# | --- 220
    93: 221, //# ] --- 221
    125: 221, //# } --- 221
    39: 222, //# ' --- 222
    34: 222, //# " --- 222
  },

  modifierCodeMap: {
    alt: 18,
    ctrl: 17,
    meta: 91,
    shift: 16,
  },

  specialChars: {
    '{selectall}': $selection.selectAll,

    //# charCode = 46
    //# no keyPress
    //# no textInput
    //# yes input (if value is actually changed)
    '{del}' (el, options) {
      options.charCode = 46
      options.keypress = false
      options.textInput = false
      options.setKey = '{del}'

      return this.ensureKey(el, null, options, () => {
        const bounds = $selection.getSelectionBounds(el)

        if ($selection.isCollapsed(el)) {
          //# if there's no text selected, delete the prev char
          //# if deleted char, send the input event
          options.input = $selection.deleteRightOfCursor(el)

          return
        }

        //# text is selected, so delete the selection
        //# contents and send the input event
        $selection.deleteSelectionContents(el)
        options.input = true

      })
    },

    //# charCode = 8
    //# no keyPress
    //# no textInput
    //# yes input (if value is actually changed)
    '{backspace}' (el, options) {
      options.charCode = 8
      options.keypress = false
      options.textInput = false
      options.setKey = '{backspace}'

      return this.ensureKey(el, null, options, () => {

        if ($selection.isCollapsed(el)) {
          //# if there's no text selected, delete the prev char
          //# if deleted char, send the input event
          options.input = $selection.deleteLeftOfCursor(el)

          return
        }

        //# text is selected, so delete the selection
        //# contents and send the input event
        $selection.deleteSelectionContents(el)
        options.input = true

      })
    },

    //# charCode = 27
    //# no keyPress
    //# no textInput
    //# no input
    '{esc}' (el, options) {
      options.charCode = 27
      options.keypress = false
      options.textInput = false
      options.input = false
      options.setKey = '{esc}'

      return this.ensureKey(el, null, options)
    },

    // "{tab}": (el, rng) ->

    '{{}' (el, options) {
      options.key = '{'

      return this.typeKey(el, options.key, options)
    },

    //# charCode = 13
    //# yes keyPress
    //# no textInput
    //# no input
    //# yes change (if input is different from last change event)
    '{enter}' (el, options) {
      options.charCode = 13
      options.textInput = false
      options.input = false
      options.setKey = '{enter}'

      return this.ensureKey(el, '\n', options, () => {
        $selection.replaceSelectionContents(el, '\n')

        return options.onEnterPressed(options.id)
      })
    },

    //# charCode = 37
    //# no keyPress
    //# no textInput
    //# no input
    '{leftarrow}' (el, options) {
      options.charCode = 37
      options.keypress = false
      options.textInput = false
      options.input = false
      options.setKey = '{leftarrow}'

      return this.ensureKey(el, null, options, () => {
        return $selection.moveCursorLeft(el)
      })
    },

    //# charCode = 39
    //# no keyPress
    //# no textInput
    //# no input
    '{rightarrow}' (el, options) {
      options.charCode = 39
      options.keypress = false
      options.textInput = false
      options.input = false
      options.setKey = '{rightarrow}'

      return this.ensureKey(el, null, options, () => {
        return $selection.moveCursorRight(el)
      })
    },

    //# charCode = 38
    //# no keyPress
    //# no textInput
    //# no input
    '{uparrow}' (el, options) {
      options.charCode = 38
      options.keypress = false
      options.textInput = false
      options.input = false
      options.setKey = '{uparrow}'

      return this.ensureKey(el, null, options, () => {
        return $selection.moveCursorUp(el)
      })
    },

    //# charCode = 40
    //# no keyPress
    //# no textInput
    //# no input
    '{downarrow}' (el, options) {
      options.charCode = 40
      options.keypress = false
      options.textInput = false
      options.input = false
      options.setKey = '{downarrow}'

      return this.ensureKey(el, null, options, () => {
        return $selection.moveCursorDown(el)
      })
    },
  },

  specialCharsNative: {
    '{selectall}': () => {
      return $selection.selectAll()
    },
    '{movetostart}': () => {
      return $selection.moveSelectionToStart()
    },
    '{movetoend}': () => {
      return $selection.moveSelectionToEnd()
    },
    '{del}': () => {
      return $native.keypress(getKeyInfo('Delete'))
    },
    '{backspace}': () => {
      return $native.keypress(getKeyInfo('Backspace'))
    },
    '{esc}': () => {
      return $native.keypress(getKeyInfo('Escape'))
    },
    '{{}': () => {
      return $native.keypress(getKeyInfo('{'))
    },
    '{enter}': () => {
      return $native.keypress(getKeyInfo('Enter'))
    },
    '{leftarrow}': () => {
      return $native.keypress(getKeyInfo('ArrowLeft'))
    },
    '{rightarrow}': () => {
      return $native.keypress(getKeyInfo('ArrowRight'))
    },
    '{uparrow}': () => {
      return $native.keypress(getKeyInfo('ArrowUp'))
    },
    '{downarrow}': () => {
      return $native.keypress(getKeyInfo('ArrowDown'))
    },
  },

  modifierChars: {
    '{alt}': 'alt',
    '{option}': 'alt',

    '{ctrl}': 'ctrl',
    '{control}': 'ctrl',

    '{meta}': 'meta',
    '{command}': 'meta',
    '{cmd}': 'meta',

    '{shift}': 'shift',
  },

  boundsAreEqual (bounds) {
    return bounds[0] === bounds[1]
  },

  type (options = {}) {
    console.log('type, options', options)
    _.defaults(options, {
      delay: 10,
      onEvent () {},
      onBeforeEvent () {},
      onFocusChange () {},
      onBeforeType () {},
      onAfterType () {},
      onValueChange () {},
      onEnterPressed () {},
      onNoMatchingSpecialChars () {},
      onBeforeSpecialCharAction () {},
    })

    /**
     * @type {HTMLElement}
     */
    const el = options.$el.get(0)

    const keys = options.chars.split(charsBetweenCurlyBracesRe).map((chars) => {
      if (charsBetweenCurlyBracesRe.test(chars)) {
        //# allow special chars and modifiers to be case-insensitive
        return chars.toLowerCase()
      }

      return chars

    })

    options.onBeforeType(this.countNumIndividualKeyStrokes(keys))

    //# should make each keystroke async to mimic
    //# how keystrokes come into javascript naturally

    let prevElement = $elements.getActiveElement(el.ownerDocument)

    return Promise
    .each(keys, (key, i) => {
      let activeEl = $elements.getActiveElement(el.ownerDocument)

      if (activeEl !== prevElement) {
        let charsNeedingType = options.onFocusChange(activeEl, keys.slice(i))

        if (charsNeedingType) {
          options.chars = charsNeedingType

          return this.type(options)
        }
      }

      return this.typeChars(el, key, options)

    }).then(() => {
      let charsNeedingType = options.onAfterType($elements.getActiveElement(el.ownerDocument))

      if (charsNeedingType) {
        options.chars = charsNeedingType

        return this.type(options)
      }

      if (options.release !== false) {
        return this.resetModifiers(el, options.window)
      }
    })
  },

  countNumIndividualKeyStrokes (keys) {
    return _.reduce(keys, (memo, chars) => {
      //# special chars count as 1 keystroke
      if (this.isSpecialChar(chars)) {
        return memo + 1
      //# modifiers don't count as keystrokes
      }

      if (this.isModifier(chars)) {
        return memo
      }

      return memo + chars.length

    }
      , 0)
  },

  typeChars (el, chars, options) {
    options = _.clone(options)

    switch (false) {
      case !this.isSpecialChar(chars):
        return Promise
        .resolve(this.handleSpecialChars(el, chars, options))
        .delay(options.delay)

      case !this.isModifier(chars):
        return Promise
        .resolve(this.handleModifier(el, chars, options))
        .delay(options.delay)

      case !charsBetweenCurlyBracesRe.test(chars):
        //# between curly braces, but not a valid special
        //# char or modifier
        const allChars = _.keys(this.specialCharsNative).concat(_.keys(this.modifierChars)).join(', ')

        return Promise
        .resolve(options.onNoMatchingSpecialChars(chars, allChars))
        .delay(options.delay)

      default:
        console.log(chars)
        const charsArr = chars.split('')
        const { delay, simulated } = options

        if (simulated) {
          return Promise.each(charsArr,
            (char) => {
              return Promise.resolve(
                this.typeKey(el, char, options)
              )
              .delay(delay)
            }
          )
        }

        if (delay) {
          return Promise.each(charsArr, (char) => {
            return $native.keypress(getKeyInfo(char)).delay(delay)
          })
        }

        return $native.keypressAll(getKeyInfo(charsArr))

    }
  },

  getCharCode (key) {
    const code = key.charCodeAt(0)

    return this.charCodeMap[code] != null ? this.charCodeMap[code] : code
  },

  expectedValueDoesNotMatchCurrentValue (expected, rng) {
    return expected !== rng.all()
  },

  moveCaretToEnd (rng) {
    const len = rng.length()

    return rng.bounds([len, len])
  },

  simulateKey (el, eventType, key, options) {
    //# bail if we've said not to fire this specific event
    //# in our options

    let charCode
    let charCodeAt
    let keyCode
    let which

    if (options[eventType] === false) {
      return true
    }

    key = options.key != null ? options.key : key

    let keys = true
    let otherKeys = true

    const event = new Event(eventType, {
      bubbles: true,
      cancelable: eventType !== 'input',
    })

    switch (eventType) {
      case 'keydown': case 'keyup':
        charCodeAt = options.charCode != null ? options.charCode : this.getCharCode(key.toUpperCase())

        charCode = 0
        keyCode = charCodeAt
        which = charCodeAt
        break

      case 'keypress':
        charCodeAt = options.charCode != null ? options.charCode : this.getCharCode(key)

        charCode = charCodeAt
        keyCode = charCodeAt
        which = charCodeAt
        break

      case 'textInput':
        charCode = 0
        keyCode = 0
        which = 0
        otherKeys = false

        _.extend(event, {
          data: key,
        })
        break

      case 'input':
        keys = false
        otherKeys = false
        break
    }

    if (otherKeys) {
      _.extend(event, {
        location: 0,
        repeat: false,
      })
      this.mixinModifiers(event)
    }

    if (keys) {
      // special key like "{enter}" might have 'key = \n'
      // in which case the original intent will be in options.setKey
      // "normal" keys will have their value in "key" argument itself
      const standardKey = $Keyboard.keyToStandard(options.setKey || key)

      _.extend(event, {
        charCode,
        detail: 0,
        key: standardKey,
        keyCode,
        layerX: 0,
        layerY: 0,
        pageX: 0,
        pageY: 0,
        view: options.window,
        which,
      })
    }

    const args = [options.id, key, eventType, charCodeAt]

    //# give the driver a chance to bail on this event
    //# if we return false here
    if (options.onBeforeEvent.apply(this, args) === false) {
      return
    }

    const dispatched = el.dispatchEvent(event)

    args.push(dispatched)

    options.onEvent.apply(this, args)

    return dispatched
  },

  typeKey (el, key, options) {
    return this.ensureKey(el, key, options, () => {

      const isDigit = isSingleDigitRe.test(key)
      const isNumberInputType = $elements.isInput(el) && $elements.isType(el, 'number')

      if (isNumberInputType) {
        const { selectionStart } = el
        const valueLength = $elements.getNativeProp(el, 'value').length
        const isDigitsInText = isStartingDigitRe.test(options.chars)
        const isValidCharacter = (key === '.') || ((key === '-') && valueLength)
        const { prevChar } = options

        if (!isDigit && (isDigitsInText || !isValidCharacter || (selectionStart !== 0))) {
          options.prevChar = key

          return
        }

        //# only type '.' and '-' if it is the first symbol and there already is a value, or if
        //# '.' or '-' are appended to a digit. If not, value cannot be set.
        if (isDigit && ((prevChar === '.') || ((prevChar === '-') && !valueLength))) {
          options.prevChar = key
          key = prevChar + key
        }
      }

      return options.updateValue(el, key, options.chars)
    })
  },

  ensureKey (el, key, options, fn) {
    _.defaults(options, {
      prevText: null,
    })

    options.id = _.uniqueId('char')
    // options.beforeKey = el.value

    const maybeUpdateValueAndFireInput = () => {
      //# only call this function if we haven't been told not to
      if (fn && (options.onBeforeSpecialCharAction(options.id, options.key) !== false)) {
        let prevText

        if (!$elements.isContentEditable(el)) {
          prevText = $elements.getNativeProp(el, 'value')
        }

        fn.call(this)

        if ((options.prevText === null) && !$elements.isContentEditable(el)) {
          options.prevText = prevText
          options.onValueChange(options.prevText, el)
        }
      }

      return this.simulateKey(el, 'input', key, options)
    }

    if (this.simulateKey(el, 'keydown', key, options)) {
      if (this.simulateKey(el, 'keypress', key, options)) {
        if (this.simulateKey(el, 'textInput', key, options)) {

          let ml

          if ($elements.isInput(el) || $elements.isTextarea(el)) {
            ml = el.maxLength
          }

          //# maxlength is -1 by default when omitted
          //# but could also be null or undefined :-/
          //# only cafe if we are trying to type a key
          if (((ml === 0) || (ml > 0)) && key) {
            //# check if we should update the value
            //# and fire the input event
            //# as long as we're under maxlength

            if ($elements.getNativeProp(el, 'value').length < ml) {
              maybeUpdateValueAndFireInput()
            }
          } else {
            maybeUpdateValueAndFireInput()
          }
        }
      }
    }

    return this.simulateKey(el, 'keyup', key, options)
  },

  isSpecialChar (chars) {
    return !!this.specialCharsNative[chars]
  },

  handleSpecialChars (el, chars, options) {
    options.key = chars
    const { simulated } = options

    if (simulated) {
      return this.specialChars[chars].call(this, el, options)
    }

    return this.specialCharsNative[chars].call(this, el, options)
  },

  modifiers: {
    alt: false,
    ctrl: false,
    meta: false,
    shift: false,
  },

  isModifier (chars) {
    return !!this.modifierChars[chars]
  },

  handleModifier (el, chars, options) {
    const modifier = this.modifierChars[chars]

    //# do nothing if already activated
    if (this.modifiers[modifier]) {
      return
    }

    this.modifiers[modifier] = true

    return this.simulateModifier(el, 'keydown', modifier, options)
  },

  simulateModifier (el, eventType, modifier, options) {
    return this.simulateKey(el, eventType, null, _.extend(options, {
      charCode: this.modifierCodeMap[modifier],
      id: _.uniqueId('char'),
      key: `<${modifier}>`,
    }))
  },

  mixinModifiers (event) {
    return _.extend(event, {
      altKey: this.modifiers.alt,
      ctrlKey: this.modifiers.ctrl,
      metaKey: this.modifiers.meta,
      shiftKey: this.modifiers.shift,
    })
  },

  activeModifiers () {
    return _.reduce(this.modifiers, (memo, isActivated, modifier) => {
      if (isActivated) {
        memo.push(modifier)
      }

      return memo
    }
      , [])
  },

  resetModifiers (el, window) {
    return (() => {
      const result = []

      for (let modifier in this.modifiers) {
        const isActivated = this.modifiers[modifier]

        this.modifiers[modifier] = false
        if (isActivated) {
          result.push(this.simulateModifier(el, 'keyup', modifier, {
            window,
            onBeforeEvent () {},
            onEvent () {},
          }))
        } else {
          result.push(undefined)
        }
      }

      return result
    })()
  },
}

$Cypress.Keyboard = $Keyboard

module.exports = $Keyboard
