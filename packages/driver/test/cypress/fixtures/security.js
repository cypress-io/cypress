/* eslint-disable  */

(function () {
  function run () {
    let div = document.createElement('div')
    div.innerText = 'security triggered'
    document.body.appendChild(div)
  }

  if (top != self) run()
  if (top!=self) run()
  if (top.location != self.location) run()
  if (top.location != location) run()
  if (self.location != top.location) run()
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
  if (parent && window != parent) run()
  if (parent && self != parent) run()
  if (parent && parent.frames && parent.frames.length > 0) run()
  if ((self.parent && !(self.parent === self)) && (self.parent.frames.length != 0)) run()
})()
