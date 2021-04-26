import * as React from 'react'

import styles from './storyHighlightWrapper.module.scss'

export const StoryHighlightWrapper: React.FC = ({ children }) => (
  <div className={styles.wrapper}>
    {children}
  </div>
)
