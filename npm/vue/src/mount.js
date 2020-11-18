// TODO: move this file into a "@cypress/vue"

// import { getPlugins } from './plugins'
import { mount as testUtilsMount } from '@vue/test-utils'

// const plugins = getPlugins().map(p => p())

export const mount = (component, options) => {
  const wrapper = testUtilsMount(component, {
    ...options,
    attachTo: '#root',
  })

  // plugins.forEach(p => p.mount(wrapper.vm.$el, wrapper))
  return wrapper
}
