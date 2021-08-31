import React from 'react'
// import { LeftNav, NavItem } from '@cypress/design-system'
// import styles from './RunnerCt.module.scss'

export interface LeftNavMenuProps {
  activeIndex: number
  // items: NavItem[]
}

export const LeftNavMenu: React.FC<LeftNavMenuProps> = (props) => {
  return (
    <div>Left Nav Menu</div>
    // <LeftNav
    //   activeIndex={props.activeIndex}
    //   leftNavClasses={styles.leftNav}
    //   navButtonClasses="button-class"
    //   items={props.items}
    // />
  )
}
