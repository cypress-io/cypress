import $ from 'jquery'
import $dimensions from './dimensions'

function addBlackoutForElement ($body: JQuery<HTMLBodyElement>, $el: JQuery<HTMLElement>) {
  const dimensions = $dimensions.getElementDimensions($el)
  const width = dimensions.widthWithBorder
  const height = dimensions.heightWithBorder
  const top = dimensions.offset?.top
  const left = dimensions.offset?.left

  const style = `border: none !important; margin: 0 !important; padding: 0 !important; position: absolute; top: ${top}px; left: ${left}px; width: ${width}px; height: ${height}px; background-color: black; z-index: 2147483647;`

  const div = document.createElement('div')

  div.className = '__cypress-blackout'
  div.style.cssText = style
  $body.append(div)
}

function addBlackouts ($body: JQuery<HTMLBodyElement>, $container: JQuery<HTMLElement>, selector: string) {
  let $el: JQuery<HTMLElement>

  try {
    // only scope blacked out elements to to screenshotted element, not necessarily the whole body
    $el = $container.find(selector)
    if (!$el.length) return
  } catch (err) {
    // if it's an invalid selector, just ignore it
    return
  }

  $el.each(function (this: HTMLElement) {
    addBlackoutForElement($body, $(this))
  })
}

function removeBlackouts ($body: JQuery<HTMLBodyElement>) {
  $body.find('.__cypress-blackout').remove()
}

export default {
  addBlackouts,
  removeBlackouts,
}
