import * as React from 'react'
import { Icon } from './Icon'
import { mountAndSnapshot } from 'util/testing'

import styles from './Icon.stories.module.scss'
import { iconLines } from './Icon.stories'

// TODO: Autogenerate from stories
describe('<Icon />', () => {
  it('Standard icons', () => {
    const Icons = () => (
      <div>
        <Icon className={styles.icon} icon='check' size='xl' />
        <Icon className={styles.icon} icon='exclamation' size='xl' />
        <Icon className={styles.icon} icon='home' size='xl' />
        <Icon className={styles.icon} icon='arrow-circle-up' size='xl' />
      </div>
    )

    mountAndSnapshot(<Icons />)
  })

  it('Icon lines', () => {
    const Icons = () => (
      <>
        {iconLines(['text-xs', 'text-s', 'text-ms', 'text-m', 'text-ml', 'text-l', 'text-xl', 'text-2xl', 'text-3xl', 'text-4xl'])}
      </>
    )

    mountAndSnapshot(<Icons />)
  })
})
