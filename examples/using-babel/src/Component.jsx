/// <reference types="cypress" />
import React from 'react'
import { getRandomNumber } from './calc'

const Component = () => {
  const n = getRandomNumber()
  return <div className="random">{n}</div>
}

export default Component
