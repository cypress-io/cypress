import { namedObserver } from './util/mobx'
import React from 'react'

export const App = namedObserver('App', (props) => {
  return (
    <div>Welcome to the app!</div>
  )
})
