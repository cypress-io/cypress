/// <reference types="cypress" />
const React = require('react')
const { getRandomNumber } = require('./calc')

const Component = () => {
  const n = getRandomNumber()
  return <div className="random">{n}</div>
}

module.exports = Component
