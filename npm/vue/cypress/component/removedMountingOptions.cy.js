import { mount } from '@cypress/vue'
import { h, defineComponent } from 'vue'

describe('removed mounting options', () => {
  it('throws error when receiving removed mounting options', () => {
    const comp = defineComponent({
      setup () {
        return () => h('div', 'hello world')
      },
    })

    for (const key of ['cssFile', 'cssFiles', 'style', 'styles', 'stylesheet', 'stylesheets']) {
      expect(() => {
        return mount(comp, {
          [key]: `body { background: red; }`,
        })
      }).to.throw(
        `The \`${key}\` mounting option is no longer supported.`,
      )
    }
  })
})
