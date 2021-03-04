import * as React from 'react'
import cs from 'classnames'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import styles from './LeftNav.module.scss'
import { LeftNavProps, NavButtonProps } from './types'

export const LeftNav: React.FC<LeftNavProps> = ({ items, activeIndex, leftNavClasses, navButtonClasses }) => {
  return (<nav className={cs(styles.leftNav, leftNavClasses || '')}>
    {items.map((item, i) => <NavButtonCell key={item.id} item={item} isActive={i === activeIndex} navButtonClasses={navButtonClasses} index={i}/>)}
  </nav>)
}

export const NavButtonCell: React.FC<NavButtonProps> = ({ item: { title, icon, interaction, itemClasses, itemClassesActive = '', itemClassesInactive = '' }, isActive, navButtonClasses, index }) => {
  return (
    <a
      href={interaction.type === 'anchor' ? interaction.href : 'javascript:;'}
      className={cs(styles.item, itemClasses, navButtonClasses, {
        [styles.active]: isActive,
        [styles.inactive]: !isActive,
        [itemClassesActive]: isActive,
        [itemClassesInactive]: !isActive,
        [styles.itemAnchor]: interaction.type === 'anchor',
      })}
      title={title}
      onClick={interaction.type === 'js' ? () => interaction.onClick(index) : undefined}>
      <FontAwesomeIcon className={styles.icon} icon={icon} size="1x" />
    </a>)
}
