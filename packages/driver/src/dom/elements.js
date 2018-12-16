/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const _ = require("lodash");
const $ = require("jquery");
const $jquery = require("./jquery");
const $window = require("./window");
const $document = require("./document");
const $utils = require("../cypress/utils");

const fixedOrStickyRe = /(fixed|sticky)/;

const focusable = "body,a[href],link[href],button,select,[tabindex],input,textarea,[contenteditable]";

const inputTypeNeedSingleValueChangeRe = /^(date|time|month|week)$/;
const canSetSelectionRangeElementRe = /^(text|search|URL|tel|password)$/;

//# rules for native methods and props
//# if a setter or getter or function then add a native method
//# if a traversal, don't

const descriptor = (klass, prop) => Object.getOwnPropertyDescriptor(window[klass].prototype, prop);

const _getValue = function() {
  switch (false) {
    case !isInput(this):
      return descriptor("HTMLInputElement", "value").get;
    case !isTextarea(this):
      return descriptor("HTMLTextAreaElement", "value").get;
    case !isSelect(this):
      return descriptor("HTMLSelectElement", "value").get;
    case !isButton(this):
      return descriptor("HTMLButtonElement", "value").get;
    default:
      //# is an option element
      return descriptor("HTMLOptionElement", "value").get;
  }
};

const _setValue = function() {
  switch (false) {
    case !isInput(this):
      return descriptor("HTMLInputElement", "value").set;
    case !isTextarea(this):
      return descriptor("HTMLTextAreaElement", "value").set;
    case !isSelect(this):
      return descriptor("HTMLSelectElement", "value").set;
    case !isButton(this):
      return descriptor("HTMLButtonElement", "value").set;
    default:
      //# is an options element
      return descriptor("HTMLOptionElement", "value").set;
  }
};

const _getSelectionStart = function() {
  switch (false) {
    case !isInput(this):
      return descriptor('HTMLInputElement', 'selectionStart').get;
    case !isTextarea(this):
      return descriptor('HTMLTextAreaElement', 'selectionStart').get;
  }
};

const _getSelectionEnd = function() {
  switch (false) {
    case !isInput(this):
      return descriptor('HTMLInputElement', 'selectionEnd').get;
    case !isTextarea(this):
      return descriptor('HTMLTextAreaElement', 'selectionEnd').get;
  }
};

const _nativeFocus = function() {
  switch (false) {
    case !$window.isWindow(this):
      return window.focus;
    case !isSvg(this):
      return window.SVGElement.prototype.focus;
    default:
      return window.HTMLElement.prototype.focus;
  }
};

const _nativeBlur = function() {
  switch (false) {
    case !$window.isWindow(this):
      return window.blur;
    case !isSvg(this):
      return window.SVGElement.prototype.blur;
    default:
      return window.HTMLElement.prototype.blur;
  }
};

const _nativeSetSelectionRange = function() {
  switch (false) {
    case !isInput(this):
      return window.HTMLInputElement.prototype.setSelectionRange;
    default:
      //# is textarea
      return window.HTMLTextAreaElement.prototype.setSelectionRange;
  }
};

const _nativeSelect = function() {
  switch (false) {
    case !isInput(this):
      return window.HTMLInputElement.prototype.select;
    default:
      //# is textarea
      return window.HTMLTextAreaElement.prototype.select;
  }
};

const _isContentEditable = function() {
  switch (false) {
    case !isSvg(this):
      return false;
    default:
      return descriptor("HTMLElement", "isContentEditable").get;
  }
};

const _setType = function() {
  switch (false) {
    case !isInput(this):
      return descriptor("HTMLInputElement", "type").set;
    case !isButton(this):
      return descriptor("HTMLButtonElement", "type").set;
  }
};


const _getType = function() {
  switch (false) {
    case !isInput(this):
      return descriptor("HTMLInputElement", "type").get;
    case !isButton(this):
      return descriptor("HTMLButtonElement", "type").get;
  }
};

const nativeGetters = {
  value: _getValue,
  selectionStart: descriptor("HTMLInputElement", "selectionStart").get,
  isContentEditable: _isContentEditable,
  isCollapsed: descriptor("Selection", 'isCollapsed').get,
  selectionStart: _getSelectionStart,
  selectionEnd: _getSelectionEnd,
  type: _getType
};

const nativeSetters = {
  value: _setValue,
  type: _setType
};

const nativeMethods = {
  addEventListener: window.EventTarget.prototype.addEventListener,
  removeEventListener: window.EventTarget.prototype.removeEventListener,
  createRange: window.document.createRange,
  getSelection: window.document.getSelection,
  removeAllRanges: window.Selection.prototype.removeAllRanges,
  addRange: window.Selection.prototype.addRange,
  execCommand: window.document.execCommand,
  getAttribute: window.Element.prototype.getAttribute,
  setSelectionRange: _nativeSetSelectionRange,
  modify: window.Selection.prototype.modify,
  focus: _nativeFocus,
  blur: _nativeBlur,
  select: _nativeSelect
};

const tryCallNativeMethod = function() {
  try {
    return callNativeMethod.apply(null, arguments);
  } catch (err) {
    return;
  }
};

var callNativeMethod = function(obj, fn, ...args) {
  let nativeFn;
  if (!(nativeFn = nativeMethods[fn])) {
    const fns = _.keys(nativeMethods).join(", ");
    throw new Error(`attempted to use a native fn called: ${fn}. Available fns are: ${fns}`);
  }

  let retFn = nativeFn.apply(obj, args);

  if (_.isFunction(retFn)) {
    retFn = retFn.apply(obj, args);
  }

  return retFn;
};

const getNativeProp = function(obj, prop) {
  let nativeProp;
  if (!(nativeProp = nativeGetters[prop])) {
    const props = _.keys(nativeGetters).join(", ");
    throw new Error(`attempted to use a native getter prop called: ${prop}. Available props are: ${props}`);
  }

  let retProp = nativeProp.call(obj, prop);

  if (_.isFunction(retProp)) {
    //# if we got back another function
    //# then invoke it again
    retProp = retProp.call(obj, prop);
  }

  return retProp;
};

const setNativeProp = function(obj, prop, val) {
  let nativeProp;
  if (!(nativeProp = nativeSetters[prop])) {
    const fns = _.keys(nativeSetters).join(", ");
    throw new Error(`attempted to use a native setter prop called: ${fn}. Available props are: ${fns}`);
  }

  let retProp = nativeProp.call(obj, val);

  if (_.isFunction(retProp)) {
    retProp = retProp.call(obj, val);
  }

  return retProp;
};

const isNeedSingleValueChangeInputElement = function(el) {
  if (!isInput(el)) {
    return false;
  }

  return inputTypeNeedSingleValueChangeRe.test(el.type);
};

const canSetSelectionRangeElement = el => isTextarea(el) || (isInput(el) && canSetSelectionRangeElementRe.test(getNativeProp(el, 'type')));

const getTagName = function(el) {
  const tagName = el.tagName || "";
  return tagName.toLowerCase();
};

const isContentEditable = el =>
  //# this property is the tell-all for contenteditable
  //# should be true for elements:
  //#   - with [contenteditable]
  //#   - with document.designMode = 'on'
  getNativeProp(el, "isContentEditable")
;

var isTextarea = el => getTagName(el) === 'textarea';

var isInput = el => getTagName(el) === 'input';

var isButton = el => getTagName(el) === 'button';

var isSelect = el => getTagName(el) === 'select';

const isOption = el => getTagName(el) === 'option';

const isBody = el => getTagName(el) === 'body';

var isSvg = function(el) {
  try {
    return "ownerSVGElement" in el;
  } catch (error) {
    return false;
  }
};

const isElement = function(obj) {
  try {
    if ($jquery.isJquery(obj)) {
      obj = obj[0];
    }

    return Boolean(obj && _.isElement(obj));
  } catch (error) {
    return false;
  }
};

const isFocusable = $el => $el.is(focusable);

const isType = function($el, type) {
  const el = [].concat($jquery.unwrap($el))[0];
  //# NOTE: use DOMElement.type instead of getAttribute('type') since
  //#       <input type="asdf"> will have type="text", and behaves like text type
  const elType = (getNativeProp(el, 'type') || "").toLowerCase();

  if (_.isArray(type)) {
    return _.includes(type, elType);
  }

  return elType === type;
};

const isScrollOrAuto = prop => (prop === "scroll") || (prop === "auto");

const isAncestor = ($el, $maybeAncestor) => $el.parents().index($maybeAncestor) >= 0;

const isSelector = ($el, selector) => $el.is(selector);

const isDetached = $el => !isAttached($el);

var isAttached = function($el) {
  //# if we're being given window
  //# then these are automaticallyed attached
  if ($window.isWindow($el)) {
    //# there is a code path when forcing focus and
    //# blur on the window where this check is necessary.
    return true;
  }

  //# if this is a document we can simply check
  //# whether or not it has a defaultView (window).
  //# documents which are part of stale pages
  //# will have this property null'd out
  if ($document.isDocument($el)) {
    return $document.hasActiveWindow($el);
  }

  //# normalize into an array
  const els = [].concat($jquery.unwrap($el));

  //# we could be passed an empty array here
  //# which in that case it is not attached
  if (els.length === 0) {
    return false;
  }

  //# get the document from the first element
  const doc = $document.getDocumentFromElement(els[0]);

  //# TODO: i guess its possible each element
  //# is technically bound to a differnet document
  //# but c'mon
  const isIn = el => $.contains(doc, el);

  //# make sure the document is currently
  //# active (it has a window) and
  //# make sure every single element
  //# is attached to this document
  return $document.hasActiveWindow(doc) && _.every(els, isIn);
};

const isSame = function($el1, $el2) {
  const el1 = $jquery.unwrap($el1);
  const el2 = $jquery.unwrap($el2);

  return el1 && el2 && _.isEqual(el1, el2);
};

const isTextLike = function($el) {
  const sel = selector => isSelector($el, selector);
  const type = type => isType($el, type);

  const isContentEditableElement = isContentEditable($el.get(0));

  return _.some([
    isContentEditableElement,
    sel("textarea"),
    sel(":text"),
    type("text"),
    type("password"),
    type("email"),
    type("number"),
    type("date"),
    type("week"),
    type("month"),
    type("time"),
    type("datetime"),
    type("datetime-local"),
    type("search"),
    type("url"),
    type("tel")
  ]);
};

const isScrollable = function($el) {
  const checkDocumentElement = function(win, documentElement) {
    //# Check if body height is higher than window height
    if (win.innerHeight < documentElement.scrollHeight) { return true; }

    //# Check if body width is higher than window width
    if (win.innerWidth < documentElement.scrollWidth) { return true; }

    //# else return false since the window is not scrollable
    return false;
  };

  //# if we're the window, we want to get the document's
  //# element and check its size against the actual window
  switch (false) {
    case !$window.isWindow($el):
      var win = $el;

      return checkDocumentElement(win, win.document.documentElement);
    default:
      //# if we're any other element, we do some css calculations
      //# to see that the overflow is correct and the scroll
      //# area is larger than the actual height or width
      var el = $el[0];

      var {overflow, overflowY, overflowX} = window.getComputedStyle(el);

      //# y axis
      //# if our content height is less than the total scroll height
      if (el.clientHeight < el.scrollHeight) {
        //# and our element has scroll or auto overflow or overflowX
        if (isScrollOrAuto(overflow) || isScrollOrAuto(overflowY)) { return true; }
      }

      //# x axis
      if (el.clientWidth < el.scrollWidth) {
        if (isScrollOrAuto(overflow) || isScrollOrAuto(overflowX)) { return true; }
      }

      return false;
  }
};

const isDescendent = function($el1, $el2) {
  if (!$el2) { return false; }

  return !!(($el1.get(0) === $el2.get(0)) || $el1.has($el2).length);
};

//# in order to simulate actual user behavior we need to do the following:
//# 1. take our element and figure out its center coordinate
//# 2. check to figure out the element listed at those coordinates
//# 3. if this element is ourself or our descendants, click whatever was returned
//# 4. else throw an error because something is covering us up
var getFirstFocusableEl = function($el) {
  if (isFocusable($el)) { return $el; }

  const parent = $el.parent();

  //# if we have no parent then just return
  //# the window since that can receive focus
  if (!parent.length) {
    const win = $window.getWindowByElement($el.get(0));

    return $(win);
  }

  return getFirstFocusableEl($el.parent());
};

var getFirstFixedOrStickyPositionParent = function($el) {
  //# return null if we're at body/html
  //# cuz that means nothing has fixed position
  if (!$el || $el.is("body,html")) { return null; }

  //# if we have fixed position return ourselves
  if (fixedOrStickyRe.test($el.css("position"))) {
    return $el;
  }

  //# else recursively continue to walk up the parent node chain
  return getFirstFixedOrStickyPositionParent($el.parent());
};

var getFirstStickyPositionParent = function($el) {
  //# return null if we're at body/html
  //# cuz that means nothing has sticky position
  if (!$el || $el.is("body,html")) { return null; }

  //# if we have sticky position return ourselves
  if ($el.css("position") === "sticky") {
    return $el;
  }

  //# else recursively continue to walk up the parent node chain
  return getFirstStickyPositionParent($el.parent());
};

const getFirstScrollableParent = function($el) {
  // doc = $el.prop("ownerDocument")

  // win = getWindowFromDoc(doc)

  //# this may be null or not even defined in IE
  // scrollingElement = doc.scrollingElement

  var search = function($el) {
    const $parent = $el.parent();

    //# we have no more parents
    if (!($parent || $parent.length)) {
      return null;
    }

    //# we match the scrollingElement
    // if $parent[0] is scrollingElement
    //   return $parent

    //# instead of fussing with scrollingElement
    //# we'll simply return null here and let our
    //# caller deal with situations where they're
    //# needing to scroll the window or scrollableElement
    if ($parent.is("html,body") || $document.isDocument($parent)) {
      return null;
    }

    if (isScrollable($parent)) {
      return $parent;
    }

    return search($parent);
  };

  return search($el);
};

const getElements = function($el) {
  if (!($el != null ? $el.length : undefined)) { return; }

  //# unroll the jquery object
  const els = $jquery.unwrap($el);

  if (els.length === 1) {
    return els[0];
  } else {
    return els;
  }
};

const getContainsSelector = function(text, filter = "") {
  const escapedText = $utils.escapeQuotes(text);
  return `${filter}:not(script):contains('${escapedText}'), ${filter}[type='submit'][value~='${escapedText}']`;
};

const priorityElement = "input[type='submit'], button, a, label";

var getFirstDeepestElement = function(elements, index = 0) {
  //# iterate through all of the elements in pairs
  //# and check if the next item in the array is a
  //# descedent of the current. if it is continue
  //# to recurse. if not, or there is no next item
  //# then return the current
  const $current = elements.slice(index,     index + 1);
  const $next    = elements.slice(index + 1, index + 2);

  if (!$next) { return $current; }

  //# does current contain next?
  if ($.contains($current.get(0), $next.get(0))) {
    return getFirstDeepestElement(elements, index + 1);
  } else {
    //# return the current if it already is a priority element
    if ($current.is(priorityElement)) { return $current; }

    //# else once we find the first deepest element then return its priority
    //# parent if it has one and it exists in the elements chain
    const $priorities = elements.filter($current.parents(priorityElement));
    if ($priorities.length) { return $priorities.last(); } else { return $current; }
  }
};

//# short form css-inlines the element
//# long form returns the outerHTML
const stringify = function(el, form = "long") {
  //# if we are formatting the window object
  let id, klass;
  if ($window.isWindow(el)) {
    return "<window>";
  }

  //# if we are formatting the document object
  if ($document.isDocument(el)) {
    return "<document>";
  }

  //# convert this to jquery if its not already one
  const $el = $jquery.wrap(el);

  switch (form) {
    case "long":
      var text     = _.chain($el.text()).clean().truncate({length: 10 }).value();
      var children = $el.children().length;
      var str      = $el.clone().empty().prop("outerHTML");
      switch (false) {
        case !children: return str.replace("></", ">...</");
        case !text:     return str.replace("></", `>${text}</`);
        default:
          return str;
      }
    case "short":
      str = $el.prop("tagName").toLowerCase();
      if (id = $el.prop("id")) {
        str += `#${id}`;
      }

      //# using attr here instead of class because
      //# svg's return an SVGAnimatedString object
      //# instead of a normal string when calling
      //# the property 'class'
      if (klass = $el.attr("class")) {
        str += `.${klass.split(/\s+/).join(".")}`;
      }

      //# if we have more than one element,
      //# format it so that the user can see there's more
      if ($el.length > 1) {
        return `[ <${str}>, ${$el.length - 1} more... ]`;
      } else {
        return `<${str}>`;
      }
  }
};


module.exports = {
  isElement,

  isSelector,

  isScrollOrAuto,

  isFocusable,

  isAttached,

  isDetached,

  isAncestor,

  isScrollable,

  isTextLike,

  isDescendent,

  isContentEditable,

  isSame,

  isBody,

  isInput,

  isTextarea,

  isType,

  isNeedSingleValueChangeInputElement,

  canSetSelectionRangeElement,

  stringify,

  getNativeProp,

  setNativeProp,

  callNativeMethod,

  tryCallNativeMethod,

  getElements,

  getFirstFocusableEl,

  getContainsSelector,

  getFirstDeepestElement,

  getFirstFixedOrStickyPositionParent,

  getFirstStickyPositionParent,

  getFirstScrollableParent
};
