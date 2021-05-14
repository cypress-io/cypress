import React from 'react'
import { mount } from '@cypress/react'
import { composeStories } from '@storybook/testing-react'

const initVirtualStorybookTest = (newStories) => {
  describe('Generated Storybook', () => {
    for (const [storyName, Story] of Object.entries(composeStories(newStories))) {
      Story.displayName = storyName
      it(storyName, () => {
        mount(React.createElement(Story, {}, null))
      })
    }
  })
}

export default initVirtualStorybookTest
