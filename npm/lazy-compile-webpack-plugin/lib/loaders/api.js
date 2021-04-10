/* eslint-env browser */
let isBrowser = typeof window !== 'undefined'

let GLOBAL_ANIMATION_KEY = '__lazyCompileWebpackPlugin'

function noop () {}

// modified from https://matthewrayfield.com/articles/animating-urls-with-javascript-and-emojis
let figures = [
  '🕐',
  '🕑',
  '🕒',
  '🕓',
  '🕔',
  '🕕',
  '🕖',
  '🕗',
  '🕘',
  '🕙',
  '🕚',
  '🕛',
]

function startAnimation () {
  if (!isBrowser) return noop

  if (window[GLOBAL_ANIMATION_KEY]) return noop

  window[GLOBAL_ANIMATION_KEY] = true

  let originTitle = document.title

  let loopHandle

  function animatioLoop () {
    loopHandle = setTimeout(animatioLoop, 50)
    document.title =
      `Compiling ${ figures[Math.floor((Date.now() / 100) % figures.length)]}`
  }
  animatioLoop()

  return () => {
    window[GLOBAL_ANIMATION_KEY] = false
    clearTimeout(loopHandle)
    document.title = originTitle
  }
}

function compile (endpoints, activationUrl) {
  let ready
  let prom = new Promise((resolve) => {
    ready = resolve
    if (!isBrowser) return

    endpoints.forEach(function (endpoint) {
      let img = new Image()

      img.src = activationUrl.replace('{host}', endpoint)
    })
  })

  prom.ready = ready

  return prom
}

module.exports = {
  isBrowser,
  startAnimation,
  compile,
}
