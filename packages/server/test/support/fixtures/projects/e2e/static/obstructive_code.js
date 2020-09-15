/* eslint-disable  */

(function () {
  function run () {
    const div = document.createElement('div')

    div.innerText = `security triggered ${(new Error).stack.split('\n', 3)[2]}`
    document.body.appendChild(div)
  }

  window.topFoo = "foo"
  window.parentFoo = "foo"

  ;(function() {
    const top = 'foo'
    const parent = 'foo'
    const self = 'foo'

    // should stay local
    if (top !== self) run()
    if (parent !== self) run()
    if (self !== top) run()
    if (self !== parent) run()
  })()

  // TODO: replace object pattern destructuring
  // ;(function() {
  //   const { top, parent, location } = window

  //   if (location != top.location) run()
  //   if (parent != top.parent) run()
  //   if (top != globalThis.top) run()
  // })()

  if (top != self) run()
  if (top!=self) run()
  if (top.location != self.location) run()
  if (top.location != location) run()
  if (parent.frames.length > 0) run()
  if (window != top) run()
  if (window.top !== window.self) run()
  if (window.top!==window.self) run()
  if (window.self != window.top) run()
  if (window.top != window.self) run()
  if (window["top"] != window["parent"]) run()
  if (window['top'] != window['parent']) run()
  if (window["top"] != self['parent']) run()
  if (parent && parent != window) run()
  if (parent && parent != self) run()
  if (parent && window.topFoo != topFoo) run()
  if (parent && window.parentFoo != parentFoo) run()
  if (parent && window != parent) run()
  if (parent && self != parent) run()
  if (parent && parent.frames && parent.frames.length > 0) run()
  if ((self.parent && !(self.parent === self)) && (self.parent.frames.length != 0)) run()

  const div = document.createElement('div')

  div.innerText = 'js ran'
  document.body.appendChild(div)
})()
