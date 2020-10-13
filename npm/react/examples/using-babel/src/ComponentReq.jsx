/// <reference types="cypress" />
// component mixes `require` and `export` keywords
const React = require('react')
const { getRandomNumber } = require('./calc')

const Component = () => {
  const n = getRandomNumber()
  return <div className="random">{n}</div>
}

export default Component
