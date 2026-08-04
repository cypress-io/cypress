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

function Field () {
  return (_target: any, _propertyKey: string) => {}
}

class Model {
  @Field() name: string = ''
}

// A decorated class field (property-decorator + class-properties) must emit its design:type.
const fieldType = Reflect.getMetadata('design:type', Model.prototype, 'name')

expect(fieldType).to.equal(String)
