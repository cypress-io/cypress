let a: number = 3
let expect = (v: number) => {
  return {
    to: {
      be: (v: number) => {
        return true
      },
    },
  }
}

context('some context[i9w]', function () {
  it('tests[abc]', () => {
    expect(a).to.be(3)
  })
})
