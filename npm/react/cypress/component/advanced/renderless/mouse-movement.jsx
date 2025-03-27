// https://medium.com/@pierrehedkvist/renderless-components-in-react-8d663746314c
// eslint-disable-next-line no-unused-vars
import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'

export default function MouseMovement ({ onMoved }) {
  const [timer, setTimer] = useState(undefined)

  function onMouseMove () {
    console.log('MouseMovement onMouseMove')
    clearTimeout(timer)
    const timerNew = setTimeout(timeout, 4000)

    setTimer(timerNew)
    onMoved(true)
  }

  function timeout () {
    console.log('timeout')
    clearTimeout(timer)
    onMoved(false)
  }

  useEffect(() => {
    // Anything in here is fired on component mount.
    console.log('MouseMovement componentWillMount')
    document.addEventListener('mousemove', onMouseMove)
    const timerNew = setTimeout(timeout, 4000)

    setTimer(timerNew)

    return () => {
      // Anything in here is fired on component unmount.
      console.log('MouseMovement componentWillUnmount')
      document.removeEventListener('mousemove', onMouseMove)
      clearTimeout(timer)
      setTimer(undefined)
    }
  }, [])

  return null
}

MouseMovement.propTypes = {
  onMoved: PropTypes.func.isRequired,
}
