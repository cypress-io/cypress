import $ from 'jquery'
import $dimensions from './dimensions'

const resetStyles = `
  border: none !important;
  margin: 0 !important;
  padding: 0 !important;
`

const styles = (styleString) => {
  return styleString.replace(/\s*\n\s*/g, '')
}

function addBlackoutForElement ($body: JQuery<HTMLBodyElement>, $el: JQuery<HTMLElement>) {
  const dimensions = $dimensions.getElementDimensions($el)
  const width = dimensions.widthWithBorder
  const height = dimensions.heightWithBorder
  const top = dimensions.offset?.top
  const left = dimensions.offset?.left

  const style = styles(`
    ${resetStyles}
    position: absolute;
    top: ${top}px;
    left: ${left}px;
    width: ${width}px;
    height: ${height}px;
    background-color: black;
    z-index: 2147483647;
  `)

  $(`<div class="__cypress-blackout" style="${style}">`).appendTo($body)
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
