import _ from 'lodash'

xdescribe('Large 3rd party library without tree-shaking', () => {
  it('successfully imports lodash', () => {
    expect(_.isBoolean(true)).to.be.true
  })
})
