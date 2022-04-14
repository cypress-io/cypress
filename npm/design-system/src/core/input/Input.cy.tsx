import * as React from 'react'
import { composeStories } from '@storybook/testing-react'
import * as stories from './Input.stories'
import { mountAndSnapshot } from 'util/testing'
// import { iconSizesWithSizes } from './Input.stories'

const {
  Input,
  // Icon
} = composeStories(stories)

// TODO: Autogenerate from stories
describe('<Input />', () => {
  it('Standard input', () => {
    mountAndSnapshot(<Input />)
  })

  it('IconInput', () => {
    // mountAndSnapshot(<Icon />)
  })

  // it('IconInput sizes', () => {
  //   const IconInput = () => (
  //     <>
  //       {iconSizesWithSizes(['xs', 's', 'ms', 'm', 'ml', 'l', 'xl', '2xl'])}
  //     </>
  //   )

  //   mountAndSnapshot(<IconInput />)
  // })
})
