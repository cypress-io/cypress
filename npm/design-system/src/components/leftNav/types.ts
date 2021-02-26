import { IconName } from '@fortawesome/fontawesome-common-types'

export interface NavItem {
  id: string

  /**
   * Displayed on hover
   */
  title: string

  icon: IconName

  interaction: {
    type: 'anchor'
    href: string
  } | {
    type: 'js'
    onClick: () => void
  }
}

export interface LeftNavProps {
  items: NavItem[]
  activeIndex?: number
}

export interface NavButtonProps {
  item: NavItem
  isActive: boolean
}
