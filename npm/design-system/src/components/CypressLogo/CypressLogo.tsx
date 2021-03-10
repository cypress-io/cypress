import React from 'react'

// @ts-ignore
import LogoPng from '../../assets/cypress-logo.png'
import styles from './CypressLogo.module.scss'

const sizes = {
  small: '8rem',
  medium: '12rem',
  large: '16rem',
}

interface LogoProps {
  size: 'small' | 'medium' | 'large'
}

export const CypressLogo: React.FC<LogoProps> = (props) => {
  return (
    <img className={styles.logo}
      style={{ width: sizes[props.size] }}
      src={LogoPng} />
  )
}
