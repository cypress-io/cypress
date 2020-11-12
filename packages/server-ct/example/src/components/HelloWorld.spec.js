/* eslint-env mocha */

import { mount } from '@vue/test-utils'
import HelloWorld from './HelloWorld'

describe('HelloWorld', () => {
  it('mounts', () => {
    mount(HelloWorld, { attachTo: '#evergreen-aut' })
  })
})
