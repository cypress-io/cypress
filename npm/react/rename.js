const fs = require('fs')
const path = require('path')
const glob = require('globby')

const torep = [
  { old: '/cy-cy.jsx', new: '/spec.cy.jsx', },
  { old: '/cy-cy.js', new: '/spec.cy.js', },
  { old: 'cy-cy.jsx', new: 'cy.jsx', },
  { old: 'cy-cy.js', new: 'cy.js', },
  { old: 'cy-cy.jsx', new: 'cy.jsx', },
  { old: '.cy-cy.tsx', new: '.cy.tsx', },
  { old: '-cy.jsx', new: '.cy.jsx', },
  { old: '-cy.js', new: '.cy.js', },
  { old: '-cy.tsx', new: '.cy.tsx', },
  { old: '-cy.ts', new: '.cy.ts', },
]

glob('./**/*cy.js', { onlyFiles: true }).then(arr => {
  // console.log(arr)
  const f = new Set()

  const towrite = []
  for (const a of new Set(arr)) {
    for (const repl of torep) {

      if (a.endsWith(repl.old) && !f.has(a)) {
        let n = a.replace(repl.old, repl.new)
        towrite.push({ a, n })

        if (a === 'examples/webpack-options/cypress/e2e/cy-cy.js') {
          console.log( { a, n })
        }

        f.add(a)

        continue
      }
    }
  }


  for (const { a, n } of towrite) {
    try {
      console.log(`Renaming: \n${a}\n${n}`)
      fs.renameSync(a, n)
    } catch (e) {
      console.log('error for ', a, n)
    }
  }
})

