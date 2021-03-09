import React from 'react'
import { LeftNav, NavItem } from '@cypress/design-system'
import styles from './RunnerCt.module.scss'

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
