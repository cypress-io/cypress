import React from 'react'
import './foo.css'
import logo from './logo.png'

export const Foo: React.FC = () => {
  return (<>
    <div>Hello world!!!!</div>
    <img src={logo} />
  </>)
}
