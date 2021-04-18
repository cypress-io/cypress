import * as React from 'react'
import { Story } from '@storybook/react'

import { createStory, createStorybookConfig } from '../../stories/util'

import { Icon as IconComponent } from './Icon'

import { library } from '@fortawesome/fontawesome-svg-core'
import { fab } from '@fortawesome/free-brands-svg-icons'
import { fas } from '@fortawesome/free-solid-svg-icons'

import typography from '../../css/derived/jsTypography.scss'
import styles from './Icon.stories.module.scss'
import { TextSize } from '../../css'
import { Baseline } from '../../measure/baseline/Baseline'

library.add(fas)
library.add(fab)

const fontOptions = ['-apple-system, BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica']

export default createStorybookConfig({
  title: 'Core/Icon',
  argTypes: {
    font: {
      control: {
        type: 'select',
        options: fontOptions,
      },
    },
  },
})

const Template: Story<{
  font: string
}> = ({ font }) => (
  <div style={{
    '--font-stack-sans': font,
  } as React.CSSProperties}
  >
    <IconComponent className={styles.icon} icon='check' size='xl' />
    <IconComponent className={styles.icon} icon='exclamation' size='xl' />
    <IconComponent className={styles.icon} icon='home' size='xl' />
    <IconComponent className={styles.icon} icon='arrow-circle-up' size='xl' />
    <br />
    {Object.keys(typography).filter((key) => key !== 'type').map((key) => {
      const size = key.replace('text-', '')

      return (
        <div
          key={key}
          style={{
            marginBottom: '2em',
          }}
        >
          <div className="text-mono-m">
            {size}
          </div>
          <Baseline className={key}>
            <IconComponent className={styles.textIcon} icon='square' size={size as TextSize} />
            <IconComponent className={styles.textIcon} icon='exclamation' size={size as TextSize} />
              The five boxing wizards jump quickly
            <IconComponent icon='exclamation' size={size as TextSize} />
            <IconComponent icon='bell' size={size as TextSize} />
          </Baseline>
        </div>
      )
    })}
  </div>
)

export const Icon = createStory(Template, {
  font: fontOptions[0],
})
