import { h } from 'vue'
import { mount } from '@cypress/vue'
import 'windi.css'

import DependencyItem from '../../src/components/DependencyItem.vue'
import { cypressWebpackDevServer } from '../../src/supportedFrameworks'

describe('DependencyItem', () => {
  it('does not render previous button on first step', () => {
    mount(() => h('ul', h(DependencyItem, { dependency: cypressWebpackDevServer })))
  })
})
