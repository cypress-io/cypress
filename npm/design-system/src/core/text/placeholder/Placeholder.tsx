import React from 'react'
import cs from 'classnames'

import { StyledText, StyledTextProps } from '../styledText/StyledText'

import styles from './Placeholder.module.scss'

/**
 * StyledText designed to act as a placeholder state. Size defaults to ms
 */
export const Placeholder: React.FC<StyledTextProps> = (props) => (
  <StyledText {...props} className={cs(styles.placeholder, props.className)} size={props.size ?? 'ms'} />
)
