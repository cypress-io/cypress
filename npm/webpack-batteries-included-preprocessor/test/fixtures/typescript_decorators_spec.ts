import 'reflect-metadata'
import { expect } from 'chai'

class Dep {}

function Injectable () {
  return (_target: any) => {}
}

@Injectable()
class Service {
  constructor (public dep: Dep) {}
}

// The constructor param type must be emitted as runtime metadata.
const paramTypes = Reflect.getMetadata('design:paramtypes', Service) as unknown[]

expect(paramTypes).to.deep.equal([Dep])
