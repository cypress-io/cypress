import $elements from '../elements'
import { unwrap, wrap, isJquery } from '../jquery'
import Debug from 'debug'

const debug = Debug('cypress:driver:dom:visibility:modernIsHidden')

const { isOption, isOptgroup, isBody, isHTML } = $elements

export function modernIsHidden (subject: JQuery<HTMLElement> | HTMLElement, options: { checkOpacity: boolean } = { checkOpacity: true }): boolean {
  debug('modernIsHidden', subject)

  if (isBody(subject) || isHTML(subject)) {
    return false
  }

  if (isJquery(subject)) {
    const subjects = unwrap(subject) as HTMLElement | HTMLElement[]

    if (Array.isArray(subjects)) {
      return subjects.some((subject: HTMLElement) => modernIsHidden(subject, options))
    }

    return modernIsHidden(subjects, options)
  }

  if (isOption(subject) || isOptgroup(subject)) {
    if (subject.hasAttribute('style') && subject.style.display === 'none') {
      return true
    }

    const select = subject.closest('select')

    if (select) {
      return modernIsHidden(wrap(select), options)
    }
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
