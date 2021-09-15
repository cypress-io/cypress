import React from 'react';
import * as stories from './Header.stories';
import { composeStories } from '@storybook/testing-react';
import { mount } from '@cypress/react';

const composedStories = composeStories(stories);

describe('Example/Header', () => {
  it('should render LoggedIn', () => {
    const { LoggedIn } = composedStories
    mount(<LoggedIn />)
  })

  // it('should render LoggedOut', () => {
  //   const { LoggedOut } = composedStories
  //   mount(<LoggedOut />)
  // })
})