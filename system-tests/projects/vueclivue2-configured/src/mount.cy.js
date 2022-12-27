import { mount } from 'cypress/vue2'
import HelloWorld from './components/HelloWorld.vue'

describe('mount', () => {
  it('throws error when receiving removed mounting options', () => {
    for (const key of ['cssFile', 'cssFiles', 'style', 'styles', 'stylesheet', 'stylesheets']) {
      expect(() => mount(HelloWorld, { 
        [key]: `body { background: red; }`
      })).to.throw(
        `The \`${key}\` mounting option is no longer supported.`
      )
    }
  })
})