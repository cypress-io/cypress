// https://medium.com/@pierrehedkvist/renderless-components-in-react-8d663746314c
import { useRef, useEffect } from 'react'
import PropTypes from 'prop-types'

export default function MouseMovement ({ onMoved }: { onMoved: (moved: boolean) => void }) {
  // a ref, not state, so the listener and cleanup always see the latest timer
  const timer = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    function timeout () {
      console.log('timeout')
      onMoved(false)
    }

    function onMouseMove () {
      console.log('MouseMovement onMouseMove')
      clearTimeout(timer.current)
      timer.current = setTimeout(timeout, 4000)
      onMoved(true)
    }

    console.log('MouseMovement componentWillMount')
    document.addEventListener('mousemove', onMouseMove)
    timer.current = setTimeout(timeout, 4000)

    return () => {
      console.log('MouseMovement componentWillUnmount')
      document.removeEventListener('mousemove', onMouseMove)
      clearTimeout(timer.current)
    }
  }, [onMoved])

  return null
}

MouseMovement.propTypes = {
  onMoved: PropTypes.func.isRequired,
}
