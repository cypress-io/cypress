import { expect } from 'chai'
import { pathed } from '@paths/paths-example-file'

// simple example of typescript types
type SomeType = {
  someProp: string
}

const someObj: SomeType = { someProp: 'someValue' }

expect(pathed).to.be.true
expect(someObj.someProp).to.equal('someValue')
