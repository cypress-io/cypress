import * as React from 'react'
import { mount } from '@cypress/react'
import { composeStories } from '@storybook/testing-react'
import * as stories from './CollapsibleGroup.stories'

const { CollapsibleGroup } = composeStories(stories)

describe('<CollapsibleGroup />', () => {
  it('playground', () => {
    mount(<CollapsibleGroup />)
  })
})
