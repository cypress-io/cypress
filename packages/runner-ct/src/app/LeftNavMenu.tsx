import React from 'react'
import { LeftNav } from '@cypress/design-system'
import styles from './RunnerCt.module.scss'
import { NavItem } from '@cypress/design-system'

export interface LeftNavMenuProps {
  activeIndex: number
  items: NavItem[]
}

export const LeftNavMenu: React.FC<LeftNavMenuProps> = (props) => {
  return (
    <LeftNav
      activeIndex={props.activeIndex}
      leftNavClasses={styles.leftNav}
      navButtonClasses="button-class"
      items={props.items}
    />
  )
}
