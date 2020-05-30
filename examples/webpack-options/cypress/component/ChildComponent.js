import React from 'react'
import { getRandomNumber } from './calc'

const ChildComponent = () => (
  <div>
    Child component <p className="random">Random number {getRandomNumber()}</p>
  </div>
)

export default ChildComponent
