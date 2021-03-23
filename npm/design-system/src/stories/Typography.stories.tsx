import * as React from 'react'
import { Story } from '@storybook/react'

import { createStory, createStorybookConfig } from './util'

import styles from './typography.module.scss'
import '../index.scss'

export default createStorybookConfig({
  title: 'System/Typography',
})

const Template: Story = () => (
  <div>
    {Object.keys(styles).filter((key) => key !== 'type').map((key) => {
      const className = (styles as Record<string, string>)[key]

      const size = key.replace('text', '')

      return (
        <div key={key} className={styles.type}>
          <div className={styles.textMonoM}>
            {size}
          </div>
          <div className={className}>The five boxing wizards jump quickly</div>
        </div>
      )
    })}
  </div>
)

export const Typography = createStory(Template)
