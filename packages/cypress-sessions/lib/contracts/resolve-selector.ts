// The `resolve-selector` command's result contract. A command's result interface
// lives here in `contracts/`, next to the command metadata in `../tap-contract`,
// so the app-side command and the CLI-side rendering type against the same shape.

// Deriving a unique selector walks up from the element testing each candidate
// against the whole document, so deriving one per match for a selector as broad
// as `*` would hold the app's main thread for the size of the page. Past this
// many matches the list is no longer one a caller picks out of anyway — so the
// app derives up to here, and the CLI numbers up to here.
export const MAX_DERIVED_SELECTORS = 10

/** A unique CSS selector for one of the elements a selector matched. */
export interface ResolveSelectorMatch {
  /**
   * The element's position in the match list, so a caller indexing that list —
   * `--at` reads `document.querySelectorAll(selector)[index]` — lands on the
   * element this entry names.
   */
  index: number
  /** A selector resolving to exactly that element, `null` if none could be derived. */
  selector: string | null
}

/** Unique CSS selectors for the elements a selector matched. */
export interface ResolveSelectorResult {
  /**
   * One entry per match, in document order. A match no unique selector could be
   * derived for keeps its entry with a `null` selector, since `--at` reads it
   * either way. Best effort in one respect: a selector matching far more elements
   * than anyone would pick from is only derived up to a cap, so this can still be
   * shorter than the number of elements matched.
   */
  selectors: ResolveSelectorMatch[]
}
