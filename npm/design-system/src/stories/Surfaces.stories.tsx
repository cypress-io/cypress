import * as React from 'react'
import { Story } from '@storybook/react'

import { createStory, createStorybookConfig } from './util'

import styles from './surfaces.module.scss'
import surfaces from '../css/derived/jsSurfaces.scss'
import '../index.scss'

export default createStorybookConfig({
  title: 'System/Surfaces',
})

const Surface: React.FC<{
  className: string
}> = ({ className }) => {
  const level = className.replace('shadow-', '')

  return (
    <div className={`${styles.surface} ${`depth-${level}`}`}>
      {`Level ${level}`}
    </div>
  )
}

const Template: Story = () => (
  <div>
    {Object.keys(surfaces).map((className) => <Surface key={className} className={className} />)}
  </div>
)

export const Surfaces = createStory(Template)
