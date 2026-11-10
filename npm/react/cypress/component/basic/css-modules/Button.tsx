import * as React from 'react'
import * as PropTypes from 'prop-types'
import styles from './Button.module.css'

interface ButtonProps {
  name: string
  orange?: boolean
  wide?: boolean
}

export const Button = ({ name, orange, wide }: ButtonProps) => {
  const className = [
    styles.componentButton,
    orange ? styles.orange : '',
    wide ? styles.wide : '',
  ]

  return (
    <div className={className.join(' ').trim()}>
      <button>{name}</button>
    </div>
  )
}

Button.propTypes = {
  orange: PropTypes.bool,
  wide: PropTypes.bool,
  name: PropTypes.string.isRequired,
}
