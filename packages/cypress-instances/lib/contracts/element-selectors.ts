// The `element-selectors` command's result contract. A command's result interface
// lives here in `contracts/`, next to the command metadata in `../tap-contract`,
// so the app-side command and the CLI-side rendering type against the same shape.

/** A unique CSS selector for one of the elements a selector matched. */
export interface ElementSelectorMatch {
  /**
   * The element's position in the match list, so a caller indexing that list —
   * `--at` reads `document.querySelectorAll(selector)[index]` — lands on the
   * element this selector names, whatever was omitted before it.
   */
  index: number
  /** A selector resolving to exactly that element. */
  selector: string
}

/** Unique CSS selectors for the elements a selector matched. */
export interface ElementSelectorsResult {
  /**
   * One entry per match, in document order. A match no unique selector could be
   * derived for is omitted, so this may be shorter than the number of elements
   * matched and its indexes may skip.
   */
  selectors: ElementSelectorMatch[]
}
