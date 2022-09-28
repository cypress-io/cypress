import React from 'react'
import { h } from 'vue'
import { mount as mountReact } from 'cypress/react'
import { mount as mountVue } from 'cypress/vue'
import { getContainerEl } from "@cypress/mount-utils"

function mountVanilla ($el) {
  const el = getContainerEl()
  el.innerHtml = ''
  el.append($el)
  return cy.wrap(el)
}

const makeOnClick = (type) => () => {
  throw new Error(`Error from ${type}!`)
}

const ReactError = () => {
  return (
    <button onClick={makeOnClick('React')}>
      Click for Error
    </button>
  )
}

const VueError = {
  setup () {
    return () => h('button', { onClick: makeOnClick('Vue') }, 'Click for Error')
  }
}

const VanillaError = () => {
  const $button = document.createElement('button')
  $button.innerText = 'Click for Error'
  $button.addEventListener('click', makeOnClick('Vanilla'))
  return $button
}

describe('Errors', () => {
  it('React: only captures the error once in the command log', () => {
    mountReact(<ReactError />).get('button').click()
  })

  it('Vue: only captures the error once in the command log', () => {
    mountVue(VueError).get('button').click()
  })

  it('Vanilla: only captures the error once in the command log', () => {
    mountVanilla(VanillaError()).get('button').click()
  })
})
