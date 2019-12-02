import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import context from './context'

const CustomRadio = ({ children, value, ...rest }) => {
  const { groupName, handleChange, value: checkedValue } = useContext(context)
  const checked = checkedValue === value

  return (
      <>
        <button
          {...rest}
          onClick={(evt) => {
            handleChange(evt, value)
          }}
          style={{
            border: 'none',
            margin: 0,
            padding: 0,
            display: 'block',
          }}
        >
          {children({ checked, ...rest })}
        </button>
        <input
          {...rest}
          readOnly
          checked={checked}
          name={groupName}
          style={{ display: 'none' }}
          type="radio"
          value={value}
        />
        </>
  )
}

CustomRadio.propTypes = {
  icon: PropTypes.oneOfType([PropTypes.func, PropTypes.node]),
}

export default CustomRadio
