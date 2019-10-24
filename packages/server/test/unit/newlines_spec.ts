import '../spec_helper'

import newlines from '../../lib/util/newlines'

describe('lib/util/newlines', function () {
  it('inserts newline at each n char', function () {
    expect(newlines.addNewlineAtEveryNChar('123456789', 3)).to.eq('123\n456\n789')
  })
})

describe('lib/util/newlines', function () {
  it('returns undefined if str not defined', function () {
    expect(newlines.addNewlineAtEveryNChar(undefined, 3)).to.eq(undefined)
  })
})
