import React from 'react'
const calc = require('./calc')

const Child = () => (
  <div className="child">
    Real child component, random {calc.getRandomNumber()}
  </div>
)

export default Child
