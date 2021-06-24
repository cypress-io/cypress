import * as React from 'react'
import type { Story } from '@storybook/react'

import { createStory, createStorybookConfig } from './util'

import styles from './colors.module.scss'
import colors from 'css/derived/jsColors.scss'
import '../index.scss'

export default createStorybookConfig({
  title: 'System/Colors',
})

const Color: React.FC<{
  name: string
}> = ({ name }) => {
  const match = name.match(/([A-Z]+)([0-9]+)/i)

  if (!match) {
    return (
      <div>
        {`Could not parse color ${name}`}
      </div>
    )
  }

  // TODO: Group colors based on type
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [, type, number] = match

  let textColor = parseInt(number, 10) < 50 ? '--metal-90' : '--metal-10'

  if (name === 'brand01') {
    // Override secondary brand
    textColor = '--metal-10'
  }

  return (
    <div className={styles.colorBlock} style={{ backgroundColor: `var(--${type}-${number})`, color: `var(${textColor})` }}>
      {name}
    </div>
  )
}

const Template: Story = () => (
  <div>
    {Object.keys(colors).map((name: string) => <Color key={name} name={name} />)}
  </div>
)

export const Colors = createStory(Template)
