import React from 'react'
import { LeftNav } from '@cypress/design-system'
import styles from './RunnerCt.module.scss'

export interface LeftNavMenuProps {
  activeIndex: number
  setActiveIndex: (index: number) => void
}

export const LeftNavMenu: React.FC<LeftNavMenuProps> = (props) => {
  const onClick = (index: number) => {
    if (props.activeIndex !== index) {
      props.setActiveIndex(index)

      return
    }

    props.setActiveIndex(undefined)
  }

  return (
    <LeftNav activeIndex={props.activeIndex}
      leftNavClasses={styles.leftNav}
      navButtonClasses="button-class"
      items={[
        {

          id: 'file-explorer-nav',
          title: 'File Explorer',
          icon: 'copy',
          interaction: {
            type: 'js',
            onClick,
          },
        },
        {
          id: 'react-devtools-nav',
          title: 'React Devtools',
          icon: ['fab', 'react'],
          itemClasses: styles.largerIcon,
          interaction: {
            type: 'js',
            onClick,
          },
        },
        {
          id: 'docs-nav',
          title: 'Cypress Documentation',
          location: 'bottom',
          icon: 'book',
          interaction: {
            type: 'anchor',
            href: 'https://on.cypress.io/component-testing',
          },
        },
      ]}
    />
  )
}
