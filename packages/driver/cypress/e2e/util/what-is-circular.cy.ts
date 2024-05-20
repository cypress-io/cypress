import { whatIsCircular } from '../../../src/util/what-is-circular'

describe('what-is-circular', function () {
  it('should return undefined if passed a non-object', function () {
    expect(whatIsCircular(2)).to.eq(undefined)
  })

  it('should return path for circular objects', function () {
    const x: any = {}

    x.cyclic = { a: 1, x }
    expect(whatIsCircular(x)).to.deep.eq(['cyclic', 'x'])
  })

  it('should return path for circular objects', function () {
    const x: any = {}

    x.cyclic = { a: {}, x }
    expect(whatIsCircular(x)).to.deep.eq(['cyclic', 'x'])
  })

  it('should return path for circular objects', function () {
    const x: any = {}

    x.cyclic = { a: {}, indirect: { x } }
    expect(whatIsCircular(x)).to.deep.eq(['cyclic', 'indirect', 'x'])
  })

  it('should return path for circular objects', function () {
    const a = {
      a: false,
      b: {
        a: false,
        c: {
          a: false,
          d: {
            e: {
              a: false,
            },
          },
        },
      },
    }

    a.b.c.d.e = a

    expect(whatIsCircular(a)).to.deep.eq(['b', 'c', 'd', 'e'])
  })

  it('should return path for circular objects', function () {
    const x: any = {
      a: [
        {
          a: 'b',
          b: 'c',
        },
        {
          a: 'b',
          b: 'c',
        },
      ],
      b: [
        'a',
        'b',
      ],
    }

    x.c = {
      x,
    }

    expect(whatIsCircular(x)).to.deep.eq(['c', 'x'])
  })

  it('should return path for circular objects in arrays', function () {
    const x: any = {
      a: [
        {
          a: 'b',
          b: 'c',
        },
        {
          a: 'b',
          b: 'c',
        },
      ],
      b: [
        'a',
        'b',
      ],
    }

    x.a[2] = x

    expect(whatIsCircular(x)).to.deep.eq(['a', '2'])
  })

  it('should return undefined for non-circular objects', function () {
    const x: any = {}

    x.cyclic = { a: 1, b: 2 }
    expect(whatIsCircular(x)).to.eq(undefined)
  })

  it('should return undefined for non-circular objects', function () {
    const x: any = {
      a: [
        {
          a: 'b',
          b: 'c',
        },
        {
          a: 'b',
          b: 'c',
        },
      ],
      b: [
        'a',
        'b',
      ],
    }

    expect(whatIsCircular(x)).to.eq(undefined)
  })

  it('should return undefined for non-circular objects', function () {
    const x: any = {}
    const y = {}

    x.cyclic = { a: y, b: y }
    expect(whatIsCircular(x)).to.eq(undefined)
  })

  it('detects circular objects and returns path', function () {
    const obj1: any = {}

    obj1.x = obj1
    expect(whatIsCircular(obj1)).to.deep.eq(['x'])

    const obj2: any = {}

    obj2.x = { y: obj2 }
    expect(whatIsCircular(obj2)).to.deep.eq(['x', 'y'])
  })

  it('detects circular arrays and returns path', function () {
    const obj1: any = []

    obj1.push(obj1)
    expect(whatIsCircular(obj1)).to.deep.eq(['0'])
  })

  it('detects non-circular objects and returns undefined', function () {
    const obj1: any = {}

    obj1.x = { y: 4 }
    expect(whatIsCircular(obj1)).to.be.undefined

    expect(whatIsCircular({})).to.be.undefined
  })

  it('detects non-circular arrays and returns undefined', function () {
    const obj1: any[] = []

    obj1.push([])
    expect(whatIsCircular(obj1)).to.be.undefined
  })

  it('returns undefined for non-objects', function () {
    expect(whatIsCircular(undefined)).to.be.undefined
    expect(whatIsCircular(null)).to.be.undefined
    expect(whatIsCircular('hi')).to.be.undefined
    expect(whatIsCircular(false)).to.be.undefined
    expect(whatIsCircular(/a/)).to.be.undefined
  })

  it('returns undefined for non-circular functions', function () {
    expect(whatIsCircular(function () {})).to.be.undefined
  })

  it('returns path for circular functions', function () {
    const f: any = function () {}

    f.x = {
      y: {
        f,
      },
    }

    expect(whatIsCircular(f)).to.deep.eq(['x', 'y', 'f'])
  })
})
