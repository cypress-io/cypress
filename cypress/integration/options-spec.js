const mountVue = require('../..')

const template = `
    <div id="app">
      {{ message }}
    </div>
  `

const data = {
  message: 'Hello Vue!'
}

/* eslint-env mocha */
describe('Pass Vue.js url', () => {
  const options = {
    vue: 'https://unpkg.com/vue'
  }

  const component = { template, data }
  beforeEach(mountVue(component, options))

  it('shows hello', () => {
    cy.contains('Hello Vue!')
  })

  it('has version', () => {
    cy.window().its('Vue.version').should('be.a', 'string')
  })
})

describe('Pass window HTML to use', () => {
  const vue = '../node_modules/vue/dist/vue.js'
  const options = {
    html: `<div id="app"></div><script src="${vue}"></script>`
  }

  const component = { template, data }
  beforeEach(mountVue(component, options))

  it('shows hello', () => {
    cy.contains('Hello Vue!')
  })

  it('has version', () => {
    cy.window().its('Vue.version').should('be.a', 'string')
  })
})
