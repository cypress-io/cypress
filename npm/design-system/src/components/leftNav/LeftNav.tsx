import * as React from 'react'
import cs from 'classnames'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import _ from 'lodash'

import styles from './LeftNav.module.scss'
import { LeftNavProps, NavButtonProps } from './types'

export const LeftNav: React.FC<LeftNavProps> = ({ items, activeIndex, leftNavClasses, navButtonClasses }) => {
  console.log({activeIndex})
  items = items.map((i, idx) => {
    i.location = i.location || 'top'
    i._index = i._index || idx
    return i
  })

  const groupedItems = _.toArray(_.groupBy(items, 'location'))

  return (<nav className={cs(styles.leftNav, leftNavClasses || '')}>
    {groupedItems.map((itemGroup) => {
      const className = itemGroup[0].location as string
      return (<nav className={styles[className]} key={`nav-section-${className}`}>{itemGroup.map((item) => {
        return (<NavButtonCell key={item.id} item={item} isActive={item._index === activeIndex} navButtonClasses={navButtonClasses} index={item._index}/>)
      })}</nav>)
    })}
  </nav>)
}

export const NavButtonCell: React.FC<NavButtonProps> = ({ item: { title, icon, interaction, itemClasses, itemClassesActive = '', itemClassesInactive = '', location }, isActive, navButtonClasses, index }) => {
  console.log(isActive)
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
