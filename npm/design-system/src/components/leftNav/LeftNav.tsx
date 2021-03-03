import * as React from 'react'
import cs from 'classnames'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import styles from './LeftNav.module.scss'
import { LeftNavProps, NavButtonProps } from './types'

export const LeftNav: React.FC<LeftNavProps> = ({ items, activeIndex, leftNavClasses, navButtonClasses }) => {
  return (<ul className={cs(styles.leftNav, leftNavClasses || '')}>
    {items.map((item, i) => <NavButtonCell key={item.id} item={item} isActive={i === activeIndex} navButtonClasses={navButtonClasses} idx={i}/>)}
  </ul>)
}

export const NavButtonCell: React.FC<NavButtonProps> = ({ item: { title, icon, interaction, itemClasses, itemClassesActive = '' }, isActive, navButtonClasses, idx }) => {
  const content = (
    <li
      className={cs(styles.item, itemClasses, navButtonClasses, {
        [styles.active]: isActive,
        [itemClassesActive]: isActive,
      })}
      title={title}
      onClick={interaction.type === 'js' ? () => interaction.onClick(idx) : undefined}>
      <FontAwesomeIcon className={styles.icon} icon={icon} size="2x" />
    </li>)

  return interaction.type === 'anchor' ? <a className={styles.itemAnchor} href={interaction.href}>{content}</a> : content
}
