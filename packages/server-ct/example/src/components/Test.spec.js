/* eslint-env mocha */

import { mount } from '@vue/test-utils'
import Test from './Test'

describe('Test', () => {
  it('mounts', () => {
    mount(Test, { attachTo: '#evergreen-aut' })
  })

  it('mounts with options', () => {
    mount(Test, { attachTo: '#evergreen-aut', props: { msg: 'Hey yall' } })
  })
})
