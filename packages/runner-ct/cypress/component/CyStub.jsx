const React = require('react')
const AuthProvider = require('./auth.js')

let CyStub = () => {
  return (
    <button onClick={AuthProvider.login}>Auth</button>
  )
}

module.exports = {
  CyStub,
}
