import React from 'react';

import MyCoolComponent from './MyCoolComponent';

export default {
  title: 'App/MyCoolComponent',
  component: MyCoolComponent,
  parameters: {
    // More on Story layout: https://storybook.js.org/docs/react/configure/story-layout
    layout: 'fullscreen',
  },
};

const Template = (args) => <MyCoolComponent {...args} />;

export const MyCoolComponentWorks = Template.bind({});
MyCoolComponentWorks.args = {
  text: 'Great!!!'
};
