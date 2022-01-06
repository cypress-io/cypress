const fs = require('fs')
const path = require('path')
const glob = require('globby')

const torep = [
  { old: '/cy-cy.js', new: '/spec.cy.js', },
  { old: '.cy-cy.js', new: '.cy.js', },
  { old: '-cy.js', new: '-cy.js', },
  { old: '-cy.jsx', new: '.cy.jsx', },
  { old: '-cy.tsx', new: '.cy.tsx', },
  { old: '-cy.ts', new: '.cy.ts', },
]
glob('./**/*cy.js').then(arr => {
  console.log(arr)

  const towrite = []
  for (const a of arr) {
    for (const repl of torep) {
      const n = a.replace(repl.old, repl.new)
      towrite.push({ a, n })
    }
  }


  for (const { a, n } of towrite) {
    fs.renameSync(a, n)
  }
})

