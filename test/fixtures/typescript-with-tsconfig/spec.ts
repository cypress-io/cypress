// simple example of typescript types
type SomeType = {
  someProp: string
}

const someObj: SomeType = { someProp: 'someValue' }

// @ts-ignore
expect(someObj.someProp).to.equal('someValue')
