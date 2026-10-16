import 'reflect-metadata'

class Dep {}

function Injectable () {
  return (_target: any) => {}
}

@Injectable()
class Service {
  constructor (public dep: Dep) {}
}

// Babel must still emit decorator metadata for typescript@7.
it('preserves emitDecoratorMetadata under typescript@7', () => {
  const paramTypes = Reflect.getMetadata('design:paramtypes', Service)

  expect(paramTypes).to.deep.eq([Dep])
})
