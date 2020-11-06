import * as React from 'react'
import * as PropTypes from 'prop-types'
import styles from './Button.modules.css'

export const Button = ({ name, orange, wide }) => {
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
