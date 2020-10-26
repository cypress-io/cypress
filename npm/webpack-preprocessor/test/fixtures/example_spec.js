it('is a test', () => {
  const [a, b] = [1, 2]

  expect(a).to.equal(1)
  expect(b).to.equal(2)
  expect(Math.min(...[3, 4])).to.equal(3)
})
