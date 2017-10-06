exports['getJustVersion returns semver if passed 1'] = `
0.20.1
`

exports['getJustVersion returns semver with tag if passed 1'] = `
1.0.0-dev
`

exports['getJustVersion returns name if starts with cypress 1'] = `
cypress@dev
`

exports['getJustVersion returns name if starts with cypress 2'] = `
cypress@alpha
`

exports['getJustVersion returns name if starts with cypress 3'] = `
cypress@0.20.3
`

exports['getJustVersion returns name if matches cypress 1'] = `
cypress
`

exports['getJustVersion extracts version from url 1'] = {
  "url": "https://foo.com/npm/0.20.3/develop-sha-13992/cypress.tgz",
  "version": "0.20.3"
}

exports['getJustVersion extracts version with dev from url 1'] = {
  "url": "https://foo.com/npm/0.20.3-dev/develop-sha-13992/cypress.tgz",
  "version": "0.20.3-dev"
}

exports['getJustVersion for anything else returns the input 1'] = {
  "url": "babababa",
  "version": "babababa"
}
