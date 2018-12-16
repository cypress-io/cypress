/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS104: Avoid inline assignments
 * DS204: Change includes calls to have a more natural evaluation order
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const _ = require("lodash");

const $jquery = require("./jquery");
const $document = require("./document");
const $elements = require("./elements");
const $coordinates = require("./coordinates");

const fixedOrAbsoluteRe = /(fixed|absolute)/;

const OVERFLOW_PROPS = ["hidden", "scroll", "auto"];

//# WARNING:
//# developer beware. visibility is a sink hole
//# that leads to sheer madness. you should
//# avoid this file before its too late.

const isVisible = el => !isHidden(el, "isVisible()");

//# TODO: we should prob update dom
//# to be passed in $utils as a dependency
//# because of circular references
var isHidden = function(el, name) {
  if (!$elements.isElement(el)) {
    if (name == null) { name = "isHidden()"; }

    throw new Error(`Cypress.dom.${name} must be passed a basic DOM element.`);
  }

  const $el = $jquery.wrap(el);

  //# in Cypress-land we consider the element hidden if
  //# either its offsetHeight or offsetWidth is 0 because
  //# it is impossible for the user to interact with this element
  //# offsetHeight / offsetWidth includes the ef
  return elHasNoEffectiveWidthOrHeight($el) ||

    //# additionally if the effective visibility of the element
    //# is hidden (which includes any parent nodes) then the user
    //# cannot interact with this element and thus it is hidden
    elHasVisibilityHidden($el) ||

      //# we do some calculations taking into account the parents
      //# to see if its hidden by a parent
      elIsHiddenByAncestors($el) ||

        //# if this is a fixed element check if its covered
        (
          elIsFixed($el) ?
            elIsNotElementFromPoint($el)
          :
            //# else check if el is outside the bounds
            //# of its ancestors overflow
            elIsOutOfBoundsOfAncestorsOverflow($el)
        );
};

var elHasNoEffectiveWidthOrHeight = $el => (elOffsetWidth($el) <= 0) || (elOffsetHeight($el) <= 0) || ($el[0].getClientRects().length <= 0);

const elHasNoOffsetWidthOrHeight = $el => (elOffsetWidth($el) <= 0) || (elOffsetHeight($el) <= 0);

var elOffsetWidth = $el => $el[0].offsetWidth;

var elOffsetHeight = $el => $el[0].offsetHeight;

var elHasVisibilityHidden = $el => $el.css("visibility") === "hidden";

const elHasDisplayNone = $el => $el.css("display") === "none";

const elHasOverflowHidden = function($el) {
  let needle;
  return (needle = "hidden", [$el.css("overflow"), $el.css("overflow-y"), $el.css("overflow-x")].includes(needle));
};

const elHasPositionRelative = $el => $el.css("position") === "relative";

const elHasClippableOverflow = function($el) {
  let needle, needle1, needle2;
  return (needle = $el.css("overflow"), OVERFLOW_PROPS.includes(needle)) ||
  (needle1 = $el.css("overflow-y"), OVERFLOW_PROPS.includes(needle1)) ||
  (needle2 = $el.css("overflow-x"), OVERFLOW_PROPS.includes(needle2));
};

const canClipContent = function($el, $ancestor) {
  //# can't clip without clippable overflow
  if (!elHasClippableOverflow($ancestor)) {
    return false;
  }

  const $offsetParent = $jquery.wrap($el[0].offsetParent);

  //# even if overflow is clippable, if an ancestor of the ancestor is the
  //# element's offset parent, the ancestor will not clip the element
  //# unless the element is position relative
  if (!elHasPositionRelative($el) && $elements.isAncestor($ancestor, $offsetParent)) {
    return false;
  }

  return true;
};

var elIsFixed = function($el) {
  let $stickyOrFixedEl;
  if ($stickyOrFixedEl = $elements.getFirstFixedOrStickyPositionParent($el)) {
    return $stickyOrFixedEl.css("position") === "fixed";
  }
};

const elAtCenterPoint = function($el) {
  let el;
  const elProps = $coordinates.getElementPositioning($el);

  const { topCenter, leftCenter } = elProps.fromViewport;

  const doc = $document.getDocumentFromElement($el.get(0));

  if (el = $coordinates.getElementAtPointFromViewport(doc, leftCenter, topCenter)) {
    return $jquery.wrap(el);
  }
};

const elDescendentsHavePositionFixedOrAbsolute = function($parent, $child) {
  //# create an array of all elements between $parent and $child
  //# including child but excluding parent
  //# and check if these have position fixed|absolute
  const $els = $child.parentsUntil($parent).add($child);

  return _.some($els.get(), el => fixedOrAbsoluteRe.test($jquery.wrap(el).css("position")));
};

var elIsNotElementFromPoint = function($el) {
  //# if we have a fixed position element that means
  //# it is fixed 'relative' to the viewport which means
  //# it MUST be available with elementFromPoint because
  //# that is also relative to the viewport
  const $elAtPoint = elAtCenterPoint($el);

  //# if the element at point is not a descendent
  //# of our $el then we know it's being covered or its
  //# not visible
  return !$elements.isDescendent($el, $elAtPoint);
};

var elIsOutOfBoundsOfAncestorsOverflow = function($el, $ancestor) {
  if ($ancestor == null) { $ancestor = $el.parent(); }

  //# no ancestor, not out of bounds!
  if (!$ancestor) { return false; }

  //# if we've reached the top parent, which is document
  //# then we're in bounds all the way up, return false
  if ($ancestor.is("body,html") || $document.isDocument($ancestor)) { return false; }

  const elProps = $coordinates.getElementPositioning($el);

  if (canClipContent($el, $ancestor)) {
    const ancestorProps = $coordinates.getElementPositioning($ancestor);

    //# target el is out of bounds
    if (
      //# target el is to the right of the ancestor's visible area
      (elProps.fromWindow.left > (ancestorProps.width + ancestorProps.fromWindow.left)) ||

      //# target el is to the left of the ancestor's visible area
      ((elProps.fromWindow.left + elProps.width) < ancestorProps.fromWindow.left) ||

      //# target el is under the ancestor's visible area
      (elProps.fromWindow.top > (ancestorProps.height + ancestorProps.fromWindow.top)) ||

      //# target el is above the ancestor's visible area
      ((elProps.fromWindow.top + elProps.height) < ancestorProps.fromWindow.top)
    ) { return true; }
  }

  return elIsOutOfBoundsOfAncestorsOverflow($el, $ancestor.parent());
};

var elIsHiddenByAncestors = function($el, $origEl) {
  //# store the original $el
  if ($origEl == null) { $origEl = $el; }

  //# walk up to each parent until we reach the body
  //# if any parent has an effective offsetHeight of 0
  //# and its set overflow: hidden then our child element
  //# is effectively hidden
  //# -----UNLESS------
  //# the parent or a descendent has position: absolute|fixed
  const $parent = $el.parent();

  //# stop if we've reached the body or html
  //# in case there is no body
  //# or if parent is the document which can
  //# happen if we already have an <html> element
  if ($parent.is("body,html") || $document.isDocument($parent)) { return false; }

  if (elHasOverflowHidden($parent) && elHasNoEffectiveWidthOrHeight($parent)) {
    //# if any of the elements between the parent and origEl
    //# have fixed or position absolute
    return !elDescendentsHavePositionFixedOrAbsolute($parent, $origEl);
  }

  //# continue to recursively walk up the chain until we reach body or html
  return elIsHiddenByAncestors($parent, $origEl);
};

var parentHasNoOffsetWidthOrHeightAndOverflowHidden = function($el) {
  //# if we've walked all the way up to body or html then return false
  if (!$el.length || $el.is("body,html")) { return false; }

  //# if we have overflow hidden and no effective width or height
  if (elHasOverflowHidden($el) && elHasNoEffectiveWidthOrHeight($el)) {
    return $el;
  } else {
    //# continue walking
    return parentHasNoOffsetWidthOrHeightAndOverflowHidden($el.parent());
  }
};

var parentHasDisplayNone = function($el) {
  //# if we have no $el or we've walked all the way up to document
  //# then return false
  if (!$el.length || $document.isDocument($el)) { return false; }

  //# if we have display none then return the $el
  if (elHasDisplayNone($el)) {
    return $el;
  } else {
    //# continue walking
    return parentHasDisplayNone($el.parent());
  }
};

var parentHasVisibilityNone = function($el) {
  //# if we've walked all the way up to document then return false
  if (!$el.length || $document.isDocument($el)) { return false; }

  //# if we have display none then return the $el
  if (elHasVisibilityHidden($el)) {
    return $el;
  } else {
    //# continue walking
    return parentHasVisibilityNone($el.parent());
  }
};

const getReasonIsHidden = function($el) {
  //# TODO: need to add in the reason an element
  //# is hidden when its fixed position and its
  //# either being covered or there is no el

  let $parent;
  const node = $elements.stringify($el, "short");

  //# returns the reason in human terms why an element is considered not visible
  switch (false) {
    case !elHasDisplayNone($el):
      return `This element '${node}' is not visible because it has CSS property: 'display: none'`;

    case !($parent = parentHasDisplayNone($el.parent())):
      var parentNode = $elements.stringify($parent, "short");

      return `This element '${node}' is not visible because its parent '${parentNode}' has CSS property: 'display: none'`;

    case !($parent = parentHasVisibilityNone($el.parent())):
      parentNode = $elements.stringify($parent, "short");

      return `This element '${node}' is not visible because its parent '${parentNode}' has CSS property: 'visibility: hidden'`;

    case !elHasVisibilityHidden($el):
      return `This element '${node}' is not visible because it has CSS property: 'visibility: hidden'`;

    case !elHasNoOffsetWidthOrHeight($el):
      var width  = elOffsetWidth($el);
      var height = elOffsetHeight($el);

      return `This element '${node}' is not visible because it has an effective width and height of: '${width} x ${height}' pixels.`;

    case !($parent = parentHasNoOffsetWidthOrHeightAndOverflowHidden($el.parent())):
      parentNode  = $elements.stringify($parent, "short");
      width       = elOffsetWidth($parent);
      height      = elOffsetHeight($parent);

      return `This element '${node}' is not visible because its parent '${parentNode}' has CSS property: 'overflow: hidden' and an effective width and height of: '${width} x ${height}' pixels.`;

    default:
      //# nested else --___________--
      if (elIsFixed($el)) {
        if (elIsNotElementFromPoint($el)) {
          //# show the long element here
          const covered = $elements.stringify(elAtCenterPoint($el));

          return `\
This element '${node}' is not visible because it has CSS property: 'position: fixed' and its being covered by another element:

${covered}\
`;
        }
      } else {
        if (elIsOutOfBoundsOfAncestorsOverflow($el)) {
          return `This element '${node}' is not visible because its content is being clipped by one of its parent elements, which has a CSS property of overflow: 'hidden', 'scroll' or 'auto'`;
        }
      }

      return `Cypress could not determine why this element '${node}' is not visible.`;
  }
};

module.exports = {
  isVisible,

  isHidden,

  getReasonIsHidden
};
