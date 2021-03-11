import { IconProp } from '@fortawesome/fontawesome-svg-core'

export type NavLocation = 'top' | 'bottom'

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
  } | {
    type: 'js'
    onClick: (index: number) => void
    targetBlank?: boolean
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
