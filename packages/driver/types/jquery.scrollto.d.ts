// Types for the jQuery.scrollTo plugin in src/config/jquery.scrollto.ts, which
// registers `$.fn.scrollTo`. Its settings are passed on to `$.fn.animate()`, so
// they accept jQuery's animation options (`done`, `fail`, `always` and so on)
// alongside the plugin's own.

type JQueryScrollToPosition = number | string

type JQueryScrollToTarget<TElement> =
  | JQueryScrollToPosition
  | Element
  | JQuery<TElement>
  | { top?: JQueryScrollToPosition, left?: JQueryScrollToPosition }

// `Omit` can't drop `duration` here: `EffectsOptions` has a `[key: string]: any` index
// signature, so `Omit` would keep only that and leave every animation option untyped.
type JQueryEffectsOptionsWithoutDuration<TElement> = {
  [K in keyof JQuery.EffectsOptions<TElement> as K extends 'duration' ? never : K]: JQuery.EffectsOptions<TElement>[K]
}

interface JQueryScrollToOptions<TElement = HTMLElement> extends JQueryEffectsOptionsWithoutDuration<TElement> {
  /** Axes to scroll, in order: `'x'`, `'y'`, `'xy'` or `'yx'`. */
  axis?: string
  /**
   * `cy.scrollTo()` and `.scrollIntoView()` pass their `duration` option through, and it
   * can be a numeric string. `$.fn.animate()` reads only numbers as milliseconds.
   */
  duration?: JQuery.Duration | string
  /** Clamp the scroll position to the scrollable range. */
  limit?: boolean
  /** Subtract the target element's margin and border from its position. */
  margin?: boolean
  /** Added to the final position. A function receives the scrolled element and the target. */
  offset?: number | { top?: number, left?: number } | ((elem: Element | Window, target: unknown) => { top?: number, left?: number })
  /** Scroll past the target by this fraction of its width or height. */
  over?: number | { top?: number, left?: number }
  /** With two axes, animate the second only after the first finishes. */
  queue?: boolean
  onAfter?: (this: Element | Window, target: unknown, settings: JQueryScrollToOptions<TElement>) => void
  onAfterFirst?: (this: Element | Window, target: unknown, settings: JQueryScrollToOptions<TElement>) => void
}

type JQueryScrollToSettings<TElement> = JQueryScrollToOptions<TElement> | JQueryScrollToOptions<TElement>['onAfter']

interface JQuery<TElement = HTMLElement> {
  /** `duration` may be left out, with the settings passed second. */
  scrollTo (target: JQueryScrollToTarget<TElement>, duration?: number | JQueryScrollToSettings<TElement>, settings?: JQueryScrollToSettings<TElement>): this
}
