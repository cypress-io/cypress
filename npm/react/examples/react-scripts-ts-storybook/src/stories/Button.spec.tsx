import React from 'react';
import * as stories from './Button.stories';
import { composeStories } from '@storybook/testing-react';
import { mount } from '@cypress/react';

const composedStories = composeStories(stories);

describe('Example/Button', () => {
  it('should render Primary', () => {
    const { Primary } = composedStories
    mount(<Primary />)
  })

  // it('should render Secondary', () => {
  //   const { Secondary } = composedStories
  //   mount(<Secondary />)
  // })

  // it('should render Large', () => {
  //   const { Large } = composedStories
  //   mount(<Large />)
  // })

  // it('should render Small', () => {
  //   const { Small } = composedStories
  //   mount(<Small />)
  // })
})