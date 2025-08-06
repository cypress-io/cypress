export type AutomationElementId = `${string}-string`

export type KeyPressSupportedKeys =
  // Numbers
  | '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9'
  // Letters
  | 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h' | 'i' | 'j' | 'k' | 'l' | 'm'
  | 'n' | 'o' | 'p' | 'q' | 'r' | 's' | 't' | 'u' | 'v' | 'w' | 'x' | 'y' | 'z'
  | 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J' | 'K' | 'L' | 'M'
  | 'N' | 'O' | 'P' | 'Q' | 'R' | 'S' | 'T' | 'U' | 'V' | 'W' | 'X' | 'Y' | 'Z'
  // Special characters
  | '!' | '@' | '#' | '$' | '%' | '^' | '&' | '*' | '(' | ')' | '-' | '_' | '='
  | '+' | '[' | ']' | '{' | '}' | '\\' | '|' | ';' | ':' | '\'' | '"' | ',' | '.'
  | '<' | '>' | '/' | '?' | '`' | '~' | ' '
  // Control keys
  | 'Enter' | 'Tab' | 'Backspace' | 'Delete' | 'Insert' | 'Home' | 'End'
  | 'PageUp' | 'PageDown' | 'Escape'
  // Arrow keys
  | 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight'
  // Function keys
  | 'F1' | 'F2' | 'F3' | 'F4' | 'F5' | 'F6' | 'F7' | 'F8' | 'F9' | 'F10' | 'F11' | 'F12'
  // Media keys
  | 'AudioVolumeMute' | 'AudioVolumeDown' | 'AudioVolumeUp'
  | 'MediaTrackNext' | 'MediaTrackPrevious' | 'MediaStop'
  | 'MediaPlayPause'
  // Other keys
  | 'NumLock' | 'ScrollLock' | 'Pause'
