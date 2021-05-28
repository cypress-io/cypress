import * as React from 'react'
import { composeStories } from '@storybook/testing-react'

import { mountAndSnapshot } from 'util/testing'

import * as stories from './PaddedBox.stories'
const { PaddedBox } = composeStories(stories)

// TODO: Autogenerate from stories
describe('<PaddedBox />', () => {
  it('PaddedBox', () => {
    mountAndSnapshot(<PaddedBox />)
  })
})
