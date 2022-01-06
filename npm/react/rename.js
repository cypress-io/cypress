const fs = require('fs')
const path = require('path')
const glob = require('globby')

const torep = [
  { old: '/cy-cy.js', new: '/spec.cy.js', },
  { old: 'cy-cy.js', new: 'cy.js', },
  { old: 'cy-cy.jsx', new: 'cy.jsx', },
  { old: '.cy-cy.tsx', new: '.cy.tsx', },
  { old: '-cy.js', new: '.cy.js', },
  { old: '-cy.jsx', new: '.cy.jsx', },
  { old: '-cy.tsx', new: '.cy.tsx', },
  { old: '-cy.ts', new: '.cy.ts', },
]
glob('./**/*cy.js', { onlyFiles: true }).then(arr => {
  // console.log(arr)

  const towrite = []
  for (const a of arr) {
    for (const repl of torep) {
      if (a.endsWith(repl.old)) {
        const n = a.replace(repl.old, repl.new)
        if (a !== n) {
          towrite.push({ a, n })
          continue
        }
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

