import * as React from 'react'
import { mount } from '@cypress/react'
import { composeStories } from '@storybook/testing-react'
import * as stories from './VirtualizedTree.stories'

const { VirtualizedTree } = composeStories(stories)

describe('<VirtualizedTree />', () => {
  it('playground', () => {
    mount(<VirtualizedTree />)
  })
})
