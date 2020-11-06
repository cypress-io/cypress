import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

let idNum = 0

const Portal = ({ children }) => {
  const [id, setId] = useState(null)

  useEffect(() => () => {
    // remove element on unmount. use a try/catch because it's possible
    // the element was removed from the dom or the dom has been blown
    // away, which will cause `removeChild` to throw an exception
    try {
      document.removeChild(element)
    } catch (err) {} // eslint-disable-line no-empty
  }, [true])

  if (!id) {
    setId(`cy-desktop-gui-portal-${idNum++}`)

    return null
  }

  let element = document.getElementById(id)

  if (!element) {
    element = document.createElement('div')
    element.id = id
    document.body.appendChild(element)
  }

  return createPortal(children, element)
}

export default Portal
