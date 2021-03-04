import { IconName } from '@fortawesome/fontawesome-common-types'

export interface NavItem {
  id: string

  /**
   * Displayed on hover
   */
  title: string

  icon: IconName

  itemClasses?: string
  itemClassesActive?: string
  itemClassesInactive?: string

  interaction: {
    type: 'anchor'
    href: string
  } | {
    type: 'js'
    onClick: (index: number) => void
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
