import * as React from 'react'
import cs from 'classnames'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import styles from './LeftNav.module.scss'
import { LeftNavProps, NavButtonProps } from './types'

export const LeftNav: React.FC<LeftNavProps> = ({ items, activeIndex }) => {
  return (<ul className={styles.leftNav}>
    {items.map((item, i) => <NavButtonCell key={item.id} item={item} isActive={i === activeIndex}/>)}
  </ul>)
}

export const NavButtonCell: React.FC<NavButtonProps> = ({ item: { title, icon, interaction }, isActive }) => {
  const content = (
    <li
      className={cs(styles.item, {
        [styles.active]: isActive,
      })}
      title={title}
      onClick={interaction.type === 'js' ? interaction.onClick : undefined}>
      <FontAwesomeIcon className={styles.icon} icon={icon} size="2x" />
    </li>)

  return interaction.type === 'anchor' ? <a className={styles.itemAnchor} href={interaction.href}>{content}</a> : content
}
