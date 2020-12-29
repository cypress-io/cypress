import $, { Cash } from 'cash-dom'

const initialCounter = 0

function increment ($counter: Cash) {
  const counterEl = $counter[0]!
  const value = parseInt(counterEl.innerText, 10)

  counterEl.innerHTML = `${value + 1}`
}

export default function counter (id = 'counter-root', rootEl?: Cash) {
  const $target = rootEl ? $(rootEl) : $(`<div id="${id}"/>`)

  $target.html('') // cleaning up between tests

  const $title = $(`<h1>Counter: <span id="counter">${initialCounter}</span></h1>`)

  const $button = $('<button>Increment</button>')

  $button.on('click', () => increment($($title.find('#counter')[0])))

  $target.append($title)
  $target.append($button)

  return $target
}
