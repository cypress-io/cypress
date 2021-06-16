import * as React from 'react'
import { composeStories } from '@storybook/testing-react'

import { mountAndSnapshot } from 'util/testing'

import * as stories from './Placeholder.stories'
const { Placeholder } = composeStories(stories)

// TODO: Autogenerate from stories
describe('<Placeholder />', () => {
  it('Placeholder', () => {
    mountAndSnapshot(<Placeholder />)
  })
})
