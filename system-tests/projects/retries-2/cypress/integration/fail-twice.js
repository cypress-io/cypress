let count = 0

it('fail twice', () => {
  count++
  if (count < 3) {
    throw new Error(`failed attempt #${count}`)
  }
})
