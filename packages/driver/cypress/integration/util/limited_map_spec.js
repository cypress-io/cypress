const LimitedMap = require('@packages/driver/src/util/limited_map')

const _ = Cypress._

describe('driver/src/util/limited_map', () => {
  it('has all the methods of a Map', () => {
    const limitedMap = new LimitedMap()

    expect(limitedMap.set).to.be.a('function')
    expect(limitedMap.get).to.be.a('function')
    expect(limitedMap.delete).to.be.a('function')
    expect(limitedMap.has).to.be.a('function')
    expect(limitedMap.size).to.be.a('number')
  })

  it('remove old entries when over limit, default 100', () => {
    const limitedMap = new LimitedMap()

    _.each(_.times(100), (i) => {
      limitedMap.set(`foo-${i}`, i)
    })

    expect(limitedMap.size).to.equal(100)
    expect(Array.from(limitedMap.values())[0]).to.equal(0)
    expect(Array.from(limitedMap.values())[99]).to.equal(99)

    limitedMap.set(`foo-${100}`, 100)
    expect(limitedMap.size).to.equal(100)
    expect(Array.from(limitedMap.values())[0]).to.equal(1)
    expect(Array.from(limitedMap.values())[99]).to.equal(100)

    limitedMap.set(`foo-${101}`, 101)
    expect(limitedMap.size).to.equal(100)
    expect(Array.from(limitedMap.values())[0]).to.equal(2)
    expect(Array.from(limitedMap.values())[99]).to.equal(101)

    limitedMap.set(`foo-${102}`, 102)
    expect(limitedMap.size).to.equal(100)
    expect(Array.from(limitedMap.values())[0]).to.equal(3)
    expect(Array.from(limitedMap.values())[99]).to.equal(102)
  })

  it('accepts limit as first parameter', () => {
    const limitedMap = new LimitedMap(5)

    _.each(_.times(5), (i) => {
      limitedMap.set(`foo-${i}`, i)
    })

    expect(limitedMap.size).to.equal(5)
    expect(Array.from(limitedMap.values())[0]).to.equal(0)
    expect(Array.from(limitedMap.values())[4]).to.equal(4)

    limitedMap.set(`foo-${5}`, 5)
    expect(limitedMap.size).to.equal(5)
    expect(Array.from(limitedMap.values())[0]).to.equal(1)
    expect(Array.from(limitedMap.values())[4]).to.equal(5)

    limitedMap.set(`foo-${6}`, 6)
    expect(limitedMap.size).to.equal(5)
    expect(Array.from(limitedMap.values())[0]).to.equal(2)
    expect(Array.from(limitedMap.values())[4]).to.equal(6)
  })
})
