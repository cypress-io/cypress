import React from 'react'
import { Story } from '@storybook/react'

import { createStory, createStorybookConfig } from './util'

import typography from 'css/derived/jsTypography.scss'
import '../index.scss'

export default createStorybookConfig({
  title: 'System/Typography',
})

const Template: Story = () => (
  <div>
    {Object.keys(typography)
      .filter((key) => key !== 'type')
      .map((key) => {
        const size = key.replace('text-', '')

        return (
          <div
            key={key}
            style={{
              marginBottom: '2em',
            }}
          >
            <div className="text-mono-m">{size}</div>
            <div className={key}>The five boxing wizards jump quickly</div>
          </div>
        )
      })}
  </div>
)

export const Typography = createStory(Template)
