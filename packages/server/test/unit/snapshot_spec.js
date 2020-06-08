const snapshot = require('snap-shot-it')

describe('snapshots', () => {
// sanity check to make sure backtick escape works with our snapshots
  it('saves snapshot with backticks', () => {
    const text = `\
line 1
line 2 with \`42\`
line 3 with \`foo\`\
`

    return snapshot('has backticks', text)
  })
})
