/* eslint-disable */
// Cross-broswer implementation of text ranges and selections
// documentation: http://bililite.com/blog/2011/01/17/cross-browser-text-ranges-and-selections/
// Version: 2.6
// Copyright (c) 2013 Daniel Wachsstock
// MIT license:
// Permission is hereby granted, free of charge, to any person
// obtaining a copy of this software and associated documentation
// files (the "Software"), to deal in the Software without
// restriction, including without limitation the rights to use,
// copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the
// Software is furnished to do so, subject to the following
// conditions:

// The above copyright notice and this permission notice shall be
// included in all copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
// EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
// OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
// HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
// WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
// FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
// OTHER DEALINGS IN THE SOFTWARE.

(function(){

// a bit of weirdness with IE11: using 'focus' is flaky, even if I'm not bubbling, as far as I can tell.
var focusEvent = 'onfocusin' in document.createElement('input') ? 'focusin' : 'focus';

// https://github.com/cypress-io/cypress/issues/647
var nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set

var nativeTextareaValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set

function setValue (el, val) {
  if (el.tagName.toLowerCase() === "input") {
    return nativeInputValueSetter.call(el, val)
  }

  return nativeTextareaValueSetter.call(el, val)
}


// IE11 normalize is buggy (http://connect.microsoft.com/IE/feedback/details/809424/node-normalize-removes-text-if-dashes-are-present)
var n = document.createElement('div');
n.appendChild(document.createTextNode('x-'));
n.appendChild(document.createTextNode('x'));
n.normalize();
var canNormalize = n.firstChild.length == 3;


var bililiteRange = function bililiteRange (el, debug){
  var ret;
  if (debug){
    ret = new NothingRange(); // Easier to force it to use the no-selection type than to try to find an old browser
  }else if (window.getSelection && el.setSelectionRange){
    // Standards. Element is an input or textarea
    // note that some input elements do not allow selections
    try{
      el.selectionStart; // even getting the selection in such an element will throw
      ret = new InputRange();
    }catch(e){
      ret = new NothingRange();
    }
  }else if (window.getSelection){
    // Standards, with any other kind of element
    ret = new W3CRange();
  }else if (document.selection){
    // Internet Explorer
    ret = new IERange();
  }else{
    // doesn't support selection
    ret = new NothingRange();
  }
  ret._el = el;
  // determine parent document, as implemented by John McLear <john@mclear.co.uk>
  ret._doc = el.ownerDocument;
  ret._win = 'defaultView' in ret._doc ? ret._doc.defaultView : ret._doc.parentWindow;
  ret._textProp = textProp(el);
  ret._bounds = [0, ret.length()];
  //  There's no way to detect whether a focus event happened as a result of a click (which should change the selection)
  // or as a result of a keyboard event (a tab in) or a script  action (el.focus()). So we track it globally, which is a hack, and is likely to fail
  // in edge cases (right-clicks, drag-n-drop), and is vulnerable to a lower-down handler preventing bubbling.
  // I just don't know a better way.
  // I'll hack my event-listening code below, rather than create an entire new bilililiteRange, potentially before the DOM has loaded
  // if (!('bililiteRangeMouseDown' in ret._doc)){
  //  var _doc = {_el: ret._doc};
  //  ret._doc.bililiteRangeMouseDown = false;
  //  bililiteRange.fn.listen.call(_doc, 'mousedown', function() {
  //    ret._doc.bililiteRangeMouseDown = true;
  //  });
  //  bililiteRange.fn.listen.call(_doc, 'mouseup', function() {
  //    ret._doc.bililiteRangeMouseDown = false;
  //  });
  // }
  // note that bililiteRangeSelection is an array, which means that copying it only copies the address, which points to the original.
  // make sure that we never let it (always do return [bililiteRangeSelection[0], bililiteRangeSelection[1]]), which means never returning
  // this._bounds directly
  if (!('bililiteRangeSelection' in el)){
    // start tracking the selection
    function trackSelection(evt){
      if (evt && evt.which == 9){
        // do tabs my way, by restoring the selection
        // there's a flash of the browser's selection, but I don't see a way of avoiding that
        ret._nativeSelect(ret._nativeRange(el.bililiteRangeSelection));
      }else{
        el.bililiteRangeSelection = ret._nativeSelection();
      }
    }
    trackSelection();
  //  // only IE does this right and allows us to grab the selection before blurring
  //  if ('onbeforedeactivate' in el){
  //    ret.listen('beforedeactivate', trackSelection);
  //  }else{
  //    // with standards-based browsers, have to listen for every user interaction
  //    ret.listen('mouseup', trackSelection).listen('keyup', trackSelection);
  //  }
  //  ret.listen(focusEvent, function(){
  //    // restore the correct selection when the element comes into focus (mouse clicks change the position of the selection)
  //    // Note that Firefox will not fire the focus event until the window/tab is active even if el.focus() is called
  //    // https://bugzilla.mozilla.org/show_bug.cgi?id=566671
  //    if (!ret._doc.bililiteRangeMouseDown){
  //      ret._nativeSelect(ret._nativeRange(el.bililiteRangeSelection));
  //    }
  //  });
  // }
  // if (!('oninput' in el)){
  //  // give IE8 a chance. Note that this still fails in IE11, which has has oninput on contenteditable elements but does not
  //  // dispatch input events. See http://connect.microsoft.com/IE/feedback/details/794285/ie10-11-input-event-does-not-fire-on-div-with-contenteditable-set
  //  // TODO: revisit this when I have IE11 running on my development machine
  //  var inputhack = function() {ret.dispatch({type: 'input'}) };
  //  ret.listen('keyup', inputhack);
  //  ret.listen('cut', inputhack);
  //  ret.listen('paste', inputhack);
  //  ret.listen('drop', inputhack);
  //  el.oninput = 'patched';
  }
  return ret;
}

function textProp(el){
  // returns the property that contains the text of the element
  // note that for <body> elements the text attribute represents the obsolete text color, not the textContent.
  // we document that these routines do not work for <body> elements so that should not be relevant
  if (typeof el.value != 'undefined') return 'value';
  if (typeof el.text != 'undefined') return 'text';
  if (typeof el.textContent != 'undefined') return 'textContent';
  return 'innerText';
}

// base class
function Range(){}
Range.prototype = {
  length: function() {
    return this._el[this._textProp].replace(/\r/g, '').length; // need to correct for IE's CrLf weirdness
  },
  bounds: function(s){
    if (bililiteRange.bounds[s]){
      this._bounds = bililiteRange.bounds[s].apply(this);
    }else if (s){
      this._bounds = s; // don't do error checking now; things may change at a moment's notice
    }else{
      var b = [
        Math.max(0, Math.min (this.length(), this._bounds[0])),
        Math.max(0, Math.min (this.length(), this._bounds[1]))
      ];
      b[1] = Math.max(b[0], b[1]);
      return b; // need to constrain it to fit
    }
    return this; // allow for chaining
  },
  select: function(){
    var b = this._el.bililiteRangeSelection = this.bounds();
    if (this._el === this._doc.activeElement){
      // only actually select if this element is active!
      this._nativeSelect(this._nativeRange(b));
    }
    this.dispatch({type: 'select'});
    return this; // allow for chaining
  },
  text: function(text, select){
    if (arguments.length){
      var bounds = this.bounds(), el = this._el;
      // signal the input per DOM 3 input events, http://www.w3.org/TR/DOM-Level-3-Events/#h4_events-inputevents
      // we add another field, bounds, which are the bounds of the original text before being changed.
      this.dispatch({type: 'beforeinput', data: text, bounds: bounds});
      this._nativeSetText(text, this._nativeRange(bounds));
      if (select == 'start'){
        this.bounds ([bounds[0], bounds[0]]);
      }else if (select == 'end'){
        this.bounds ([bounds[0]+text.length, bounds[0]+text.length]);
      }else if (select == 'all'){
        this.bounds ([bounds[0], bounds[0]+text.length]);
      }
      this.dispatch({type: 'input', data: text, bounds: bounds});
      return this; // allow for chaining
    }else{
      return this._nativeGetText(this._nativeRange(this.bounds())).replace(/\r/g, ''); // need to correct for IE's CrLf weirdness
    }
  },
  insertEOL: function (){
    this._nativeEOL();
    this._bounds = [this._bounds[0]+1, this._bounds[0]+1]; // move past the EOL marker
    return this;
  },
  // sendkeys: function (text){
  //   var self = this;
  //   this.data().sendkeysOriginalText = this.text();
  //   this.data().sendkeysBounds = undefined;
  //   function simplechar (rng, c){
  //     if (/^{[^}]*}$/.test(c)) c = c.slice(1,-1); // deal with unknown {key}s
  //     for (var i =0; i < c.length; ++i){
  //       var x = c.charCodeAt(i);
  //       rng.dispatch({type: 'keypress', keyCode: x, which: x, charCode: x});
  //     }
  //     rng.text(c, 'end');
  //   }
  //   text.replace(/{[^}]*}|[^{]+|{/g, function(part){
  //     (bililiteRange.sendkeys[part] || simplechar)(self, part, simplechar);
  //   });
  //   this.bounds(this.data().sendkeysBounds);
  //   this.dispatch({type: 'sendkeys', which: text});
  //   return this;
  // },
  top: function(){
    return this._nativeTop(this._nativeRange(this.bounds()));
  },
  scrollIntoView: function(scroller){
    var top = this.top();
    // scroll into position if necessary
    if (this._el.scrollTop > top || this._el.scrollTop+this._el.clientHeight < top){
      if (scroller){
        scroller.call(this._el, top);
      }else{
        this._el.scrollTop = top;
      }
    }
    return this;
  },
  wrap: function (n){
    this._nativeWrap(n, this._nativeRange(this.bounds()));
    return this;
  },
  selection: function(text){
    if (arguments.length){
      return this.bounds('selection').text(text, 'end').select();
    }else{
      return this.bounds('selection').text();
    }
  },
  clone: function(){
    return bililiteRange(this._el).bounds(this.bounds());
  },
  all: function(text){
    if (arguments.length){
      this.dispatch ({type: 'beforeinput', data: text});
      this._el[this._textProp] = text;
      this.dispatch ({type: 'input', data: text});
      return this;
    }else{
      return this._el[this._textProp].replace(/\r/g, ''); // need to correct for IE's CrLf weirdness
    }
  },
  element: function() { return this._el },
  // includes a quickie polyfill for CustomEvent for IE that isn't perfect but works for me
  // IE10 allows custom events but not "new CustomEvent"; have to do it the old-fashioned way
  dispatch: function(opts){return this;},
  // dispatch: function(opts){
  //   opts = opts || {};
  //   var event = document.createEvent ? document.createEvent('CustomEvent') : this._doc.createEventObject();
  //   event.initCustomEvent && event.initCustomEvent(opts.type, !!opts.bubbles, !!opts.cancelable, opts.detail);
  //   for (var key in opts) event[key] = opts[key];
  //   // dispatch event asynchronously (in the sense of on the next turn of the event loop; still should be fired in order of dispatch
  //   var el = this._el;
  //   setTimeout(function(){
  //     try {
  //       el.dispatchEvent ? el.dispatchEvent(event) : el.fireEvent("on" + opts.type, document.createEventObject());
  //       }catch(e){
  //       // IE8 will not let me fire custom events at all. Call them directly
  //         var listeners = el['listen'+opts.type];
  //         if (listeners) for (var i = 0; i < listeners.length; ++i){
  //           listeners[i].call(el, event);
  //         }
  //       }
  //   }, 0);
  //   return this;
  // },
  // listen: function (type, func){
  //   var el = this._el;
  //   if (el.addEventListener){
  //     el.addEventListener(type, func);
  //   }else{
  //     el.attachEvent("on" + type, func);
  //     // IE8 can't even handle custom events created with createEventObject  (though it permits attachEvent), so we have to make our own
  //     var listeners = el['listen'+type] = el['listen'+type] || [];
  //     listeners.push(func);
  //   }
  //   return this;
  // },
  // dontlisten: function (type, func){
  //   var el = this._el;
  //   if (el.removeEventListener){
  //     el.removeEventListener(type, func);
  //   }else try{
  //     el.detachEvent("on" + type, func);
  //   }catch(e){
  //     var listeners = el['listen'+type];
  //     if (listeners) for (var i = 0; i < listeners.length; ++i){
  //       if (listeners[i] === func) listeners[i] = function(){}; // replace with a noop
  //     }
  //   }
  //   return this;
  // }
};

// allow extensions ala jQuery
bililiteRange.fn = Range.prototype; // to allow monkey patching
bililiteRange.extend = function(fns){
  for (fn in fns) Range.prototype[fn] = fns[fn];
};

//bounds functions
bililiteRange.bounds = {
  all: function() { return [0, this.length()] },
  start: function () { return [0,0] },
  end: function () { return [this.length(), this.length()] },
  selection: function(){
    if (this._el === this._doc.activeElement){
      this.bounds ('all'); // first select the whole thing for constraining
      return this._nativeSelection();
    }else{
      return this._el.bililiteRangeSelection;
    }
  }
};

// sendkeys functions
bililiteRange.sendkeys = {
  '{enter}': function (rng){
    simplechar(rng, '\n');
    rng.insertEOL();
  },
  '{tab}': function (rng, c, simplechar){
    simplechar(rng, '\t'); // useful for inserting what would be whitespace
  },
  '{newline}': function (rng, c, simplechar){
    simplechar(rng, '\n'); // useful for inserting what would be whitespace (and if I don't want to use insertEOL, which does some fancy things)
  },
  '{backspace}': function (rng){
    var b = rng.bounds();
    if (b[0] == b[1]) rng.bounds([b[0]-1, b[0]]); // no characters selected; it's just an insertion point. Remove the previous character
    rng.text('', 'end'); // delete the characters and update the selection
  },
  '{del}': function (rng){
    var b = rng.bounds();
    if (b[0] == b[1]) rng.bounds([b[0], b[0]+1]); // no characters selected; it's just an insertion point. Remove the next character
    rng.text('', 'end'); // delete the characters and update the selection
  },
  '{rightarrow}':  function (rng){
    var b = rng.bounds();
    if (b[0] == b[1]) ++b[1]; // no characters selected; it's just an insertion point. Move to the right
    rng.bounds([b[1], b[1]]);
  },
  '{leftarrow}': function (rng){
    var b = rng.bounds();
    if (b[0] == b[1]) --b[0]; // no characters selected; it's just an insertion point. Move to the left
    rng.bounds([b[0], b[0]]);
  },
  '{selectall}' : function (rng){
    rng.bounds('all');
  },
  '{selection}': function (rng){
    // insert the characters without the sendkeys processing
    var s = rng.data().sendkeysOriginalText;
    for (var i =0; i < s.length; ++i){
      var x = s.charCodeAt(i);
      rng.dispatch({type: 'keypress', keyCode: x, which: x, charCode: x});
    }
    rng.text(s, 'end');
  },
  '{mark}' : function (rng){
    rng.data().sendkeysBounds = rng.bounds();
  }
};
// Synonyms from the proposed DOM standard (http://www.w3.org/TR/DOM-Level-3-Events-key/)
bililiteRange.sendkeys['{Enter}'] = bililiteRange.sendkeys['{enter}'];
bililiteRange.sendkeys['{Backspace}'] = bililiteRange.sendkeys['{backspace}'];
bililiteRange.sendkeys['{Delete}'] = bililiteRange.sendkeys['{del}'];
bililiteRange.sendkeys['{ArrowRight}'] = bililiteRange.sendkeys['{rightarrow}'];
bililiteRange.sendkeys['{ArrowLeft}'] = bililiteRange.sendkeys['{leftarrow}'];

function IERange(){}
IERange.prototype = new Range();
IERange.prototype._nativeRange = function (bounds){
  var rng;
  if (this._el.tagName == 'INPUT'){
    // IE 8 is very inconsistent; textareas have createTextRange but it doesn't work
    rng = this._el.createTextRange();
  }else{
    rng = this._doc.body.createTextRange ();
    rng.moveToElementText(this._el);
  }
  if (bounds){
    if (bounds[1] < 0) bounds[1] = 0; // IE tends to run elements out of bounds
    if (bounds[0] > this.length()) bounds[0] = this.length();
    if (bounds[1] < rng.text.replace(/\r/g, '').length){ // correct for IE's CrLf weirdness
      // block-display elements have an invisible, uncounted end of element marker, so we move an extra one and use the current length of the range
      rng.moveEnd ('character', -1);
      rng.moveEnd ('character', bounds[1]-rng.text.replace(/\r/g, '').length);
    }
    if (bounds[0] > 0) rng.moveStart('character', bounds[0]);
  }
  return rng;
};
IERange.prototype._nativeSelect = function (rng){
  rng.select();
};
IERange.prototype._nativeSelection = function (){
  // returns [start, end] for the selection constrained to be in element
  var rng = this._nativeRange(); // range of the element to constrain to
  var len = this.length();
  var sel = this._doc.selection.createRange();
  try{
    return [
      iestart(sel, rng),
      ieend (sel, rng)
    ];
  }catch (e){
    // TODO: determine if this is still necessary, since we only call _nativeSelection if _el is active
    // IE gets upset sometimes about comparing text to input elements, but the selections cannot overlap, so make a best guess
    return (sel.parentElement().sourceIndex < this._el.sourceIndex) ? [0,0] : [len, len];
  }
};
IERange.prototype._nativeGetText = function (rng){
  return rng.text;
};
IERange.prototype._nativeSetText = function (text, rng){
  rng.text = text;
};
IERange.prototype._nativeEOL = function(){
  if ('value' in this._el){
    this.text('\n'); // for input and textarea, insert it straight
  }else{
    this._nativeRange(this.bounds()).pasteHTML('\n<br/>');
  }
};
IERange.prototype._nativeTop = function(rng){
  var startrng = this._nativeRange([0,0]);
  return rng.boundingTop - startrng.boundingTop;
}
IERange.prototype._nativeWrap = function(n, rng) {
  // hacky to use string manipulation but I don't see another way to do it.
  var div = document.createElement('div');
  div.appendChild(n);
  // insert the existing range HTML after the first tag
  var html = div.innerHTML.replace('><', '>'+rng.htmlText+'<');
  rng.pasteHTML(html);
};

// IE internals
function iestart(rng, constraint){
  // returns the position (in character) of the start of rng within constraint. If it's not in constraint, returns 0 if it's before, length if it's after
  var len = constraint.text.replace(/\r/g, '').length; // correct for IE's CrLf weirdness
  if (rng.compareEndPoints ('StartToStart', constraint) <= 0) return 0; // at or before the beginning
  if (rng.compareEndPoints ('StartToEnd', constraint) >= 0) return len;
  for (var i = 0; rng.compareEndPoints ('StartToStart', constraint) > 0; ++i, rng.moveStart('character', -1));
  return i;
}
function ieend (rng, constraint){
  // returns the position (in character) of the end of rng within constraint. If it's not in constraint, returns 0 if it's before, length if it's after
  var len = constraint.text.replace(/\r/g, '').length; // correct for IE's CrLf weirdness
  if (rng.compareEndPoints ('EndToEnd', constraint) >= 0) return len; // at or after the end
  if (rng.compareEndPoints ('EndToStart', constraint) <= 0) return 0;
  for (var i = 0; rng.compareEndPoints ('EndToStart', constraint) > 0; ++i, rng.moveEnd('character', -1));
  return i;
}

// an input element in a standards document. "Native Range" is just the bounds array
function InputRange(){}
InputRange.prototype = new Range();
InputRange.prototype._nativeRange = function(bounds) {
  return bounds || [0, this.length()];
};
InputRange.prototype._nativeSelect = function (rng){
  try {
    this._el.setSelectionRange(rng[0], rng[1]);
  } catch (e) {
    if (typeof this._el.select === 'function') {
      this._el.select()
    } else {
      console.error('Failed to select text on', this._el)
    }
  }
};
InputRange.prototype._nativeSelection = function(){
  var originalType = this._el.type

  //// HACK:
  //// newer versions of Chrome incorrectly report the selection
  //// for number and email types, so we change it to type=text
  //// and blur it (then set it back and focus it further down
  //// after the selection algorithm has taken place)
  var shouldChangeType = originalType === 'email' || originalType === 'number'
  if (shouldChangeType) {
    this._el.blur()
    this._el.type = 'text'
  }

  var start = this._el.selectionStart
  var end = this._el.selectionEnd

  var selection = [start, end]

  //// HACK:
  //// selection start and end don't report correctly when input
  //// already has a value set, so if there's a value and there is no
  //// native selection, force it to be at the end of the text
  if (this._el.value && !start && !end) {
    var length = this._el.value.length
    selection = [length, length]
  }

  if (shouldChangeType) {
    this._el.type = originalType
    this._el.focus()
  }

  return selection
};
InputRange.prototype._nativeGetText = function(rng){
  return this._el.value.substring(rng[0], rng[1]);
};
InputRange.prototype._nativeSetText = function(text, rng){
  var val = this._el.value;
  setValue(this._el, val.substring(0, rng[0]) + text + val.substring(rng[1]));
};
InputRange.prototype._nativeEOL = function(){
  this.text('\n');
};
InputRange.prototype._nativeTop = function(rng){
  // I can't remember where I found this clever hack to find the location of text in a text area
  var clone = this._el.cloneNode(true);
  clone.style.visibility = 'hidden';
  clone.style.position = 'absolute';
  this._el.parentNode.insertBefore(clone, this._el);
  clone.style.height = '1px';
  setValue(clone, this._el.value.slice(0, rng[0]));
  var top = clone.scrollHeight;
  // this gives the bottom of the text, so we have to subtract the height of a single line
  setValue(clone, 'X');
  top -= clone.scrollHeight;
  clone.parentNode.removeChild(clone);
  return top;
}
InputRange.prototype._nativeWrap = function() {throw new Error("Cannot wrap in a text element")};

function W3CRange(){}
W3CRange.prototype = new Range();
W3CRange.prototype._nativeRange = function (bounds){
  var rng = this._doc.createRange();
  rng.selectNodeContents(this._el);
  if (bounds){
    w3cmoveBoundary (rng, bounds[0], true, this._el);
    rng.collapse (true);
    w3cmoveBoundary (rng, bounds[1]-bounds[0], false, this._el);
  }
  return rng;
};
W3CRange.prototype._nativeSelect = function (rng){
  this._win.getSelection().removeAllRanges();
  this._win.getSelection().addRange (rng);
};
W3CRange.prototype._nativeSelection = function (){
  // returns [start, end] for the selection constrained to be in element
  var rng = this._nativeRange(); // range of the element to constrain to
  if (this._win.getSelection().rangeCount == 0) return [this.length(), this.length()]; // append to the end
  var sel = this._win.getSelection().getRangeAt(0);
  return [
    w3cstart(sel, rng),
    w3cend (sel, rng)
  ];
  }
W3CRange.prototype._nativeGetText = function (rng){
  return String.prototype.slice.apply(this._el.textContent, this.bounds());
  // return rng.toString(); // this fails in IE11 since it insists on inserting \r's before \n's in Ranges. node.textContent works as expected
};
W3CRange.prototype._nativeSetText = function (text, rng){
  rng.deleteContents();
  rng.insertNode (this._doc.createTextNode(text));
  if (canNormalize) this._el.normalize(); // merge the text with the surrounding text
};
W3CRange.prototype._nativeEOL = function(){
  var rng = this._nativeRange(this.bounds());
  rng.deleteContents();
  var br = this._doc.createElement('br');
  br.setAttribute ('_moz_dirty', ''); // for Firefox
  rng.insertNode (br);
  rng.insertNode (this._doc.createTextNode('\n'));
  rng.collapse (false);
};
W3CRange.prototype._nativeTop = function(rng){
  if (this.length == 0) return 0; // no text, no scrolling
  if (rng.toString() == ''){
    var textnode = this._doc.createTextNode('X');
    rng.insertNode (textnode);
  }
  var startrng = this._nativeRange([0,1]);
  var top = rng.getBoundingClientRect().top - startrng.getBoundingClientRect().top;
  if (textnode) textnode.parentNode.removeChild(textnode);
  return top;
}
W3CRange.prototype._nativeWrap = function(n, rng) {
  rng.surroundContents(n);
};

// W3C internals
function nextnode (node, root){
  //  in-order traversal
  // we've already visited node, so get kids then siblings
  if (node.firstChild) return node.firstChild;
  if (node.nextSibling) return node.nextSibling;
  if (node===root) return null;
  while (node.parentNode){
    // get uncles
    node = node.parentNode;
    if (node == root) return null;
    if (node.nextSibling) return node.nextSibling;
  }
  return null;
}
function w3cmoveBoundary (rng, n, bStart, el){
  // move the boundary (bStart == true ? start : end) n characters forward, up to the end of element el. Forward only!
  // if the start is moved after the end, then an exception is raised
  if (n <= 0) return;
  var node = rng[bStart ? 'startContainer' : 'endContainer'];
  if (node.nodeType == 3){
    // we may be starting somewhere into the text
    n += rng[bStart ? 'startOffset' : 'endOffset'];
  }
  while (node){
    if (node.nodeType == 3){
      var length = node.nodeValue.length;
      if (n <= length){
        rng[bStart ? 'setStart' : 'setEnd'](node, n);
        // special case: if we end next to a <br>, include that node.
        if (n == length){
          // skip past zero-length text nodes
          for (var next = nextnode (node, el); next && next.nodeType==3 && next.nodeValue.length == 0; next = nextnode(next, el)){
            rng[bStart ? 'setStartAfter' : 'setEndAfter'](next);
          }
          if (next && next.nodeType == 1 && next.nodeName == "BR") rng[bStart ? 'setStartAfter' : 'setEndAfter'](next);
        }
        return;
      }else{
        rng[bStart ? 'setStartAfter' : 'setEndAfter'](node); // skip past this one
        n -= length; // and eat these characters
      }
    }
    node = nextnode (node, el);
  }
}
var     START_TO_START                 = 0; // from the w3c definitions
var     START_TO_END                   = 1;
var     END_TO_END                     = 2;
var     END_TO_START                   = 3;
// from the Mozilla documentation, for range.compareBoundaryPoints(how, sourceRange)
// -1, 0, or 1, indicating whether the corresponding boundary-point of range is respectively before, equal to, or after the corresponding boundary-point of sourceRange.
    // * Range.END_TO_END compares the end boundary-point of sourceRange to the end boundary-point of range.
    // * Range.END_TO_START compares the end boundary-point of sourceRange to the start boundary-point of range.
    // * Range.START_TO_END compares the start boundary-point of sourceRange to the end boundary-point of range.
    // * Range.START_TO_START compares the start boundary-point of sourceRange to the start boundary-point of range.
function w3cstart(rng, constraint){
  if (rng.compareBoundaryPoints (START_TO_START, constraint) <= 0) return 0; // at or before the beginning
  if (rng.compareBoundaryPoints (END_TO_START, constraint) >= 0) return constraint.toString().length;
  rng = rng.cloneRange(); // don't change the original
  rng.setEnd (constraint.endContainer, constraint.endOffset); // they now end at the same place
  return constraint.toString().replace(/\r/g, '').length - rng.toString().replace(/\r/g, '').length;
}
function w3cend (rng, constraint){
  if (rng.compareBoundaryPoints (END_TO_END, constraint) >= 0) return constraint.toString().length; // at or after the end
  if (rng.compareBoundaryPoints (START_TO_END, constraint) <= 0) return 0;
  rng = rng.cloneRange(); // don't change the original
  rng.setStart (constraint.startContainer, constraint.startOffset); // they now start at the same place
  return rng.toString().replace(/\r/g, '').length;
}

function NothingRange(){}
NothingRange.prototype = new Range();
NothingRange.prototype._nativeRange = function(bounds) {
  return bounds || [0,this.length()];
};
NothingRange.prototype._nativeSelect = function (rng){ // do nothing
};
NothingRange.prototype._nativeSelection = function(){
  return [0,0];
};
NothingRange.prototype._nativeGetText = function (rng){
  return this._el[this._textProp].substring(rng[0], rng[1]);
};
NothingRange.prototype._nativeSetText = function (text, rng){
  var val = this._el[this._textProp];
  this._el[this._textProp] = val.substring(0, rng[0]) + text + val.substring(rng[1]);
};
NothingRange.prototype._nativeEOL = function(){
  this.text('\n');
};
NothingRange.prototype._nativeTop = function(){
  return 0;
};
NothingRange.prototype._nativeWrap = function() {throw new Error("Wrapping not implemented")};


// data for elements, similar to jQuery data, but allows for monitoring with custom events
var data = []; // to avoid attaching javascript objects to DOM elements, to avoid memory leaks
bililiteRange.fn.data = function(){
  var index = this.element().bililiteRangeData;
  if (index == undefined){
    index = this.element().bililiteRangeData = data.length;
    data[index] = new Data(this);
  }
  return data[index];
}
try {
  Object.defineProperty({},'foo',{}); // IE8 will throw an error
  var Data = function(rng) {
    // we use JSON.stringify to display the data values. To make some of those non-enumerable, we have to use properties
    Object.defineProperty(this, 'values', {
      value: {}
    });
    Object.defineProperty(this, 'sourceRange', {
      value: rng
    });
    Object.defineProperty(this, 'toJSON', {
      value: function(){
        var ret = {};
        for (var i in Data.prototype) if (i in this.values) ret[i] = this.values[i];
        return ret;
      }
    });
    // to display all the properties (not just those changed), use JSON.stringify(state.all)
    Object.defineProperty(this, 'all', {
      get: function(){
        var ret = {};
        for (var i in Data.prototype) ret[i] = this[i];
        return ret;
      }
    });
  }

  Data.prototype = {};
  Object.defineProperty(Data.prototype, 'values', {
    value: {}
  });
  Object.defineProperty(Data.prototype, 'monitored', {
    value: {}
  });

  bililiteRange.data = function (name, newdesc){
    newdesc = newdesc || {};
    var desc = Object.getOwnPropertyDescriptor(Data.prototype, name) || {};
    if ('enumerable' in newdesc) desc.enumerable = !!newdesc.enumerable;
    if (!('enumerable' in desc)) desc.enumerable = true; // default
    if ('value' in newdesc) Data.prototype.values[name] = newdesc.value;
    if ('monitored' in newdesc) Data.prototype.monitored[name] = newdesc.monitored;
    desc.configurable = true;
    desc.get = function (){
      if (name in this.values) return this.values[name];
      return Data.prototype.values[name];
    };
    desc.set = function (value){
      this.values[name] = value;
      if (Data.prototype.monitored[name]) this.sourceRange.dispatch({
        type: 'bililiteRangeData',
        bubbles: true,
        detail: {name: name, value: value}
      });
    }
    Object.defineProperty(Data.prototype, name, desc);
  }
}catch(err){
  // if we can't set object property properties, just use old-fashioned properties
  Data = function(rng){ this.sourceRange = rng };
  Data.prototype = {};
  bililiteRange.data = function(name, newdesc){
    if ('value' in newdesc) Data.prototype[name] = newdesc.value;
  }
}

module.exports = bililiteRange

})();
