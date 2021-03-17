import * as React from 'react'
import cs from 'classnames'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { library } from '@fortawesome/fontawesome-svg-core'
import { fas } from '@fortawesome/free-solid-svg-icons'

library.add(fas)

import styles from './LeftNav.module.scss'
import { LeftNavProps, NavButtonProps, NavLocation, NavItem } from './types'

interface NavItemDefinedLocation extends NavItem {
  location: NavLocation
  _index: number
}

interface GroupedItems {
  top: NavItemDefinedLocation[]
  bottom: NavItemDefinedLocation[]
}

export const LeftNav: React.FC<LeftNavProps> = ({ items, activeIndex, leftNavClasses, navButtonClasses }) => {
  const mappedItems = items.reduce<GroupedItems>((acc, curr, index) => {
    if (curr.location === 'bottom') {
      return {
        top: acc.top,
        bottom: acc.bottom.concat({
          ...curr,
          _index: curr._index || index,
          location: 'bottom',
        }),
      }
    }

    return {
      top: acc.top.concat({
        ...curr,
        _index: curr._index || index,
        location: 'top',
      }),
      bottom: acc.bottom,
    }
  }, { top: [], bottom: [] })

  const navItem = (item: NavItemDefinedLocation) => (
    <NavButtonCell
      key={item.id}
      item={item}
      isActive={item._index === activeIndex}
      navButtonClasses={navButtonClasses}
      index={item._index}
    />
  )

  const topNav = (
    <nav
      className={styles.top}
      key='nav-section-top'
    >
      {mappedItems.top.map((item) => navItem(item))}
    </nav>
  )

  const bottomNav = (
    <nav
      className={styles.bottom}
      key='nav-section-bottom'
    >
      {mappedItems.bottom.map((item) => navItem(item))}
    </nav>
  )

  const nav = (
    <nav className={cs(styles.leftNav, leftNavClasses || '')}>
      {topNav}
      {bottomNav}
    </nav>
  )

  return nav
}

export const NavButtonCell: React.FC<NavButtonProps> = ({ item: { title, icon, interaction, itemClasses, itemClassesActive = '', itemClassesInactive = '', location }, isActive, navButtonClasses, index }) => {
  const commonClasses = cs(styles.item, itemClasses, navButtonClasses, {
    [styles.active]: isActive,
    [styles.inactive]: !isActive,
    [itemClassesActive]: isActive,
    [itemClassesInactive]: !isActive,
  })

  const faIcon = <FontAwesomeIcon className={styles.icon} icon={icon} size="1x" />

  if (interaction.type === 'anchor') {
    const anchorProps = {
      href: interaction.href,
      className: cs(styles.itemAnchor, commonClasses),
      onClick: (event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
        if (!interaction.onClick) {
          return
        }

        interaction.onClick({ event, index })
      },
      title,
    }

    if (interaction.targetBlank) {
      return (
        <a
          {...anchorProps}
          target='_blank'
        >
          {faIcon}
        </a>
      )
    }

    return (
      <a {...anchorProps}>
        {faIcon}
      </a>
    )
  }

  return (
    <a
      className={commonClasses}
      title={title}
      onClick={(event) => interaction.onClick({ event, index })}
    >
      {faIcon}
    </a>
  )
}
