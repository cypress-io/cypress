import * as React from 'react'
import { composeStories } from '@storybook/testing-react'
import * as stories from './Input.stories'
import { mountAndSnapshot } from 'util/testing'

const { Input, Icon } = composeStories(stories)

// TODO: Autogenerate from stories
describe('<Input />', () => {
  it('Standard input', () => {
    mountAndSnapshot(<Input />)
  })

  it('IconInput', () => {
    mountAndSnapshot(<Icon />)
  })

  it('IconInput sizes', () => {
    const IconInput = () => <>{stories.iconSizesWithSizes(['xs', 's', 'ms', 'm', 'ml', 'l', 'xl', '2xl'])}</>

    mountAndSnapshot(<IconInput />)
  })
})
