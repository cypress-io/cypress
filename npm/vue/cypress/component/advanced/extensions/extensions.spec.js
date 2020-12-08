/// <reference path="../../../../dist/index.d.ts" />
import { h } from 'vue'
import { mount } from '@cypress/vue'
import Extension from './Extension.vue'

/* eslint-env mocha */
describe('Extension', () => {
  describe('components', () => {
    it('registers a component', () => {
      const Foo = {
        render () {
          return h('h1', 'Hello world!')
        },
      }

      mount(Extension, {
        extensions: {
          components: { Foo },
        },
      })

      cy.get('h1').contains('Hello world!')
    })
  })
})
