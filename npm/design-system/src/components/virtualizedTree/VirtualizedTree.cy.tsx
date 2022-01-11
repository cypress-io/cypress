import * as React from 'react'
import { composeStories } from '@storybook/testing-react'

import { mountAndSnapshot } from 'util/testing'

import * as stories from './VirtualizedTree.stories'
const { VirtualizedTree } = composeStories(stories)

// TODO: Autogenerate from stories
describe('<VirtualizedTree />', () => {
  it('VirtualizedTree', () => {
    mountAndSnapshot(<VirtualizedTree />)
  })
})
