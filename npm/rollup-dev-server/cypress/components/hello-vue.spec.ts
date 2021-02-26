import { mount } from '@cypress/vue'

xdescribe('Vue TODO: make this work', () => {
  it('mounts', () => {
    const App = {
      template: `<div>Hello Vue</div>`,
    }

    mount(App)
  })
})
