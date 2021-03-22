import * as React from 'react'
import { Story } from '@storybook/react'

import { createStory, createStorybookConfig } from './util'

import styles from './colors.scss'

// export default {
//   title: 'Example/Button',
//   component: Button,
//   argTypes: {
//     backgroundColor: { control: 'color' },
//   },
// } as Meta;

export default createStorybookConfig({
  title: 'System/Colors',
})

const Template: Story = () => (<div>
  <div className={`${styles.colorBlock} .bg-brand-00`}></div>
</div>)

export const Colors = createStory(Template)
