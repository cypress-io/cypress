import * as React from 'react'
import { composeStories } from '@storybook/testing-react'

import { mountAndSnapshot } from 'util/testing'

import * as stories from './Button.stories'
const { Button, IconButton } = composeStories(stories)

// TODO: Autogenerate from stories
describe('<Button />', () => {
  it('Button', () => {
    mountAndSnapshot(<Button />)
  })

  it('ButtonSizes', () => {
    const ButtonSizes = () => (
      <div style={{ width: 500 }}>
        {stories.buttonSizesWithSizes(['text-xs', 'text-s', 'text-ms', 'text-m', 'text-ml', 'text-l', 'text-xl', 'text-2xl', 'text-3xl', 'text-4xl'])}
      </div>
    )

    mountAndSnapshot(<ButtonSizes />)
  })

  it('IconButton', () => {
    mountAndSnapshot(<IconButton />)
  })
})
