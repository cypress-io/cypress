import React from 'react'

// simple example of typescript types
type SomeType = {
  someProp: string
}

const someObj: SomeType = { someProp: 'someValue' }
const component = <div className={someObj.someProp} />

// @ts-ignore
expect(component).to.be.an('object')
