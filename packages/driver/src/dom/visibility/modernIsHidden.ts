import { unwrap, isJquery } from '../jquery'
import Debug from 'debug'

const debug = Debug('cypress:driver:dom:visibility:modernIsHidden')

export function modernIsHidden (subject: JQuery<HTMLElement> | HTMLElement, options: { checkOpacity: boolean } = { checkOpacity: true }): boolean {
  debug('modernIsHidden', subject)

  if (isJquery(subject)) {
    const subjects = unwrap(subject) as HTMLElement | HTMLElement[]

    if (Array.isArray(subjects)) {
      return subjects.some((subject: HTMLElement) => modernIsHidden(subject, options))
    }

    return modernIsHidden(subjects, options)
  }

  if (!subject.checkVisibility({
    contentVisibilityAuto: true,
    opacityProperty: options.checkOpacity,
    visibilityProperty: true,
  } as CheckVisibilityOptions)) {
    return true
  }

  // checkVisibility() does not consider element dimensions; treat 0-dim as hidden.
  const { width, height } = subject.getBoundingClientRect()

  return width <= 0 || height <= 0
}
