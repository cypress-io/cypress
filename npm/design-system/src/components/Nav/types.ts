import { IconProp } from '@fortawesome/fontawesome-svg-core'

export type NavLocation = 'top' | 'bottom'

export interface NavClick {
  index: number
  event: React.MouseEvent<HTMLAnchorElement, MouseEvent>
}

export interface NavItem {
  id: string
  _index?: number

  /**
   * Displayed on hover
   */
  title: string

  icon: IconProp

  itemClasses?: string
  itemClassesActive?: string
  itemClassesInactive?: string
  location?: NavLocation

  interaction: {
    type: 'anchor'
    href: string
    targetBlank?: boolean
    onClick?: (payload: NavClick) => void
  } | {
    type: 'js'
    onClick: (payload: NavClick) => void
  }
}

export interface LeftNavProps {
  items: NavItem[]
  activeIndex?: number
  leftNavClasses?: string
  navButtonClasses?: string
}

export interface NavButtonProps {
  index: number
  item: NavItem
  isActive: boolean
  navButtonClasses?: string
}
