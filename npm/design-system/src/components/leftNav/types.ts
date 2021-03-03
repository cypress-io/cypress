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

  interaction: {
    type: 'anchor'
    href: string
  } | {
    type: 'js'
    onClick: (idx: number) => void
  }
}

export interface LeftNavProps {
  items: NavItem[]
  activeIndex?: number
  leftNavClasses?: string
  navButtonClasses?: string
}

export interface NavButtonProps {
  idx: number
  item: NavItem
  isActive: boolean
  navButtonClasses?: string
}
