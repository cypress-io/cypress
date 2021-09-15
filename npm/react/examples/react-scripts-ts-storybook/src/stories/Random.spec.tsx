import React from 'react';
import * as stories from './Random.stories';
import { composeStories } from '@storybook/testing-react';
import { mount } from '@cypress/react';

const composedStories = composeStories(stories);

describe('Example/Button', () => {
  it('should render Primary', () => {
    const { Primary } = composedStories
    mount(<Primary />)
  })
})