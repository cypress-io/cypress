import * as React from 'react'
import { Story } from '@storybook/react'

import { createStory, createStorybookConfig } from './util'

import styles from './surfaces.module.scss'
import '../index.scss'

export default createStorybookConfig({
  title: 'System/Surfaces',
})

const Surface: React.FC<{
  className: string
}> = ({ className }) => {
  const level = className.replace('depth', '')

  return (
    <div className={`${styles.surface} ${styles[`depth${level}`]}`}>
      {`Level ${level.replace('Negative', '-')}`}
    </div>
  )
}

const Template: Story = () => (
  <div>
    {Object.keys(styles).filter((className) => className !== 'surface').map((className) => <Surface key={className} className={className} />)}
  </div>
)

export const Surfaces = createStory(Template)
