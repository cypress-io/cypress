require('../spec_helper')

const randomstring = require('randomstring')
const random = require(`${root}lib/util/random`)

context('.id', () => {
  it('returns random.generate string with length 5 by default', () => {
    sinon.spy(randomstring, 'generate')

    const id = random.id()

    expect(id.length).to.eq(5)

    expect(randomstring.generate).to.be.calledWith({
      length: 5,
      capitalization: 'lowercase',
    })
  })

  it('passes the length parameter if supplied', () => {
    sinon.spy(randomstring, 'generate')

    const id = random.id(32)

    expect(id.length).to.eq(32)

    expect(randomstring.generate).to.be.calledWith({
      length: 32,
      capitalization: 'lowercase',
    })
  })
})
