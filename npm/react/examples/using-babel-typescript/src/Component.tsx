import * as React from 'react'
import { getRandomNumber } from './calc'

/**
 * Example React component that imports `getRandomNumber`
 * function from another file and uses it to show a random
 * number in the UI.
 */
export const Component = () => {
  const n = getRandomNumber()
  return <div className="random">{n}</div>
}

export default Component
