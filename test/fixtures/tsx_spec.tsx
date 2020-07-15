import React from 'react'

// simple example of typescript types
type SomeType = {
  someProp: string
}

it('uses jsx', () => {
  const someObj: SomeType = { someProp: 'someValue' }

  console.log(<div className={someObj.someProp} />) // eslint-disable-line no-console
})
