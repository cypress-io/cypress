import * as React from 'react'
import { Story } from '@storybook/react'

import { createStory, createStorybookConfig } from './util'

import styles from './spacing.module.scss'
import spacing from '../css/derived/jsSpacing.scss'
import '../index.scss'

export default createStorybookConfig({
  title: 'System/Spacing',
})

const currentFontSize = () => parseFloat(getComputedStyle(document.documentElement).fontSize)

const pixelsFromRem = (rem: string) => {
  const remFloat = parseFloat(rem.replace('rem', ''))

  return remFloat * currentFontSize()
}

const Cube: React.FC<{
  name: string
}> = ({ name }) => {
  const size: string = spacing[name]
  const pixelSize = pixelsFromRem(size)

  return (
    <div>
      <div>
        {`${name}: ${size} (${pixelSize}px @ ${currentFontSize()})`}
      </div>
      <div
        className={styles.cube}
        style={{
          height: size,
          width: size,
        }}
      >
      </div>
    </div>
  )
}

const Template: Story = () => (
  <div>
    {Object.keys(spacing).map((name) => <Cube key={name} name={name} />)}
  </div>
)

export const Spacing = createStory(Template)
