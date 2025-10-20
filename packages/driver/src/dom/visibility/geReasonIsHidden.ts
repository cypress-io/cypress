import { elHasOverflowHidden, elHasNoEffectiveWidthOrHeight, elHasOpacityZero, elAtCenterPoint, elIsOutOfBoundsOfAncestorsOverflow, elIsNotElementFromPoint, elClientHeight, elClientWidth, elHasVisibilityCollapse, elHasVisibilityHidden, getFirstSelectParentFromEl, elHasDisplayNone, parentHasDisplayNone } from './isVisible'
import $elements from '../elements'
import * as $transform from '../transform'
import $document from '../document'

const { isUndefinedOrHTMLBodyDoc, isOptgroup, isOption, stringify, getParent, isDetached, elOrAncestorIsFixedOrSticky } = $elements

/* eslint-disable no-cond-assign */
export const getReasonIsHidden = function ($el, options = { checkOpacity: true }) {
  // TODO: need to add in the reason an element
  // is hidden when its fixed position and its
  // either being covered or there is no el

  const node = stringify($el, 'short')
  let width = elClientWidth($el)
  let height = elClientHeight($el)
  let $parent
  let parentNode
  let $select

  // if the element is an option or optgroup then we need to get the
  // select so it can be used when determining the hidden reason
  if (isOption($el[0]) || isOptgroup($el[0])) {
    $select = getFirstSelectParentFromEl($el)
  }

  // returns the reason in human terms why an element is considered not visible
  if (elHasDisplayNone($el)) {
    return `This element \`${node}\` is not visible because it has CSS property: \`display: none\``
  }

  if ($parent = parentHasDisplayNone(getParent($el))) {
    parentNode = stringify($parent, 'short')

    return `This element \`${node}\` is not visible because its parent \`${parentNode}\` has CSS property: \`display: none\``
  }

  if ($parent = parentHasVisibilityHidden(getParent($el))) {
    parentNode = stringify($parent, 'short')

    return `This element \`${node}\` is not visible because its parent \`${parentNode}\` has CSS property: \`visibility: hidden\``
  }

  if ($parent = parentHasVisibilityCollapse(getParent($el))) {
    parentNode = stringify($parent, 'short')

    return `This element \`${node}\` is not visible because its parent \`${parentNode}\` has CSS property: \`visibility: collapse\``
  }

  if (isDetached($el)) {
    return `This element \`${node}\` is not visible because it is detached from the DOM`
  }

  if (elHasVisibilityHidden($el)) {
    return `This element \`${node}\` is not visible because it has CSS property: \`visibility: hidden\``
  }

  if (elHasVisibilityCollapse($el)) {
    return `This element \`${node}\` is not visible because it has CSS property: \`visibility: collapse\``
  }

  if (elHasOpacityZero($el) && options.checkOpacity) {
    return `This element \`${node}\` is not visible because it has CSS property: \`opacity: 0\``
  }

  if (($parent = parentHasOpacityZero($el.parent())) && options.checkOpacity) {
    parentNode = stringify($parent, 'short')

    return `This element \`${node}\` is not visible because its parent \`${parentNode}\` has CSS property: \`opacity: 0\``
  }

  const transformResult = $transform.detectVisibility($el)

  if (transformResult === 'transformed') {
    return `This element \`${node}\` is not visible because it is hidden by transform.`
  }

  if (elHasNoClientWidthOrHeight($select || $el)) {
    return `This element \`${node}\` is not visible because it has an effective width and height of: \`${width} x ${height}\` pixels.`
  }

  if (transformResult === 'backface') {
    return `This element \`${node}\` is not visible because it is rotated and its backface is hidden.`
  }

  if ($parent = parentHasNoClientWidthOrHeightAndOverflowHidden(getParent($el))) {
    parentNode = stringify($parent, 'short')
    let width = elClientWidth($parent)
    let height = elClientHeight($parent)

    return `This element \`${node}\` is not visible because its parent \`${parentNode}\` has CSS property: \`overflow: hidden\` and an effective width and height of: \`${width} x ${height}\` pixels.`
  }

  if (elOrAncestorIsFixedOrSticky($el)) {
    if (elIsNotElementFromPoint($el)) {
      // show the long element here
      const covered = stringify(elAtCenterPoint($el))

      if (covered) {
        return `This element \`${node}\` is not visible because it has CSS property: \`position: fixed\` and it's being covered by another element:\n\n\`${covered}\``
      }

      return `This element \`${node}\` is not visible because its ancestor has \`position: fixed\` CSS property and it is overflowed by other elements. How about scrolling to the element with \`cy.scrollIntoView()\`?`
    }
  } else {
    if (elIsOutOfBoundsOfAncestorsOverflow($el)) {
      return `This element \`${node}\` is not visible because its content is being clipped by one of its parent elements, which has a CSS property of overflow: \`hidden\`, \`clip\`, \`scroll\` or \`auto\``
    }
  }

  return `This element \`${node}\` is not visible.`
}

function parentHasVisibilityHidden ($el) {
  // if we've walked all the way up to document then return false
  if (!$el.length || $document.isDocument($el)) {
    return false
  }

  // if we have display none then return the $el
  if (elHasVisibilityHidden($el)) {
    return $el
  }

  // continue walking
  return parentHasVisibilityHidden(getParent($el))
}

function parentHasVisibilityCollapse ($el) {
  // if we've walked all the way up to document then return false
  if (!$el.length || $document.isDocument($el)) {
    return false
  }

  // if we have display none then return the $el
  if (elHasVisibilityCollapse($el)) {
    return $el
  }

  // continue walking
  return parentHasVisibilityCollapse(getParent($el))
}
function elHasNoClientWidthOrHeight ($el) {
  return (elClientWidth($el) <= 0) || (elClientHeight($el) <= 0)
}
function parentHasOpacityZero ($el) {
  // if we've walked all the way up to document then return false
  if (!$el.length || $document.isDocument($el)) {
    return false
  }

  // if we have opacity: 0 then return the $el
  if (elHasOpacityZero($el)) {
    return $el
  }

  // continue walking
  return parentHasOpacityZero($el.parent())
}

function parentHasNoClientWidthOrHeightAndOverflowHidden ($el: JQuery<HTMLElement>) {
  // if we've walked all the way up to body or html then return false
  if (isUndefinedOrHTMLBodyDoc($el)) {
    return false
  }

  // if we have overflow hidden and no effective width or height
  if (elHasOverflowHidden($el) && elHasNoEffectiveWidthOrHeight($el)) {
    return $el
  }

  // continue walking
  return parentHasNoClientWidthOrHeightAndOverflowHidden(getParent($el))
}
