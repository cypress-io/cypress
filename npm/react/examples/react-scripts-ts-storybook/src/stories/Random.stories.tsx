import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';

const Button = (props: {message: string}) => <div>{props.message}</div>


export default {
  title: 'Example/Button',
  component: Button,
  argTypes: {
    backgroundColor: { control: 'color' },
  },
} as ComponentMeta<typeof Button>;

const Template: ComponentStory<typeof Button> = (args) => <Button {...args} />;

export const Primary = Template.bind({});
Primary.args = {
  message: 'Hello',
};
