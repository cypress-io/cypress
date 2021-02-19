import { isBoolean } from 'lodash'

xdescribe('Large 3rd party library with tree-shaking', () => {
  it('successfully imports isBoolean from lodash', () => {
    expect(isBoolean(true)).to.be.true
  })
})
