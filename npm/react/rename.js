const fs = require('fs')
const glob = require('globby')

const torep = [
  { old: '/cy-cy.jsx', new: '/spec.cy.jsx' },
  { old: '/cy-cy.js', new: '/spec.cy.js' },
  { old: 'cy-cy.jsx', new: 'cy.jsx' },
  { old: 'cy-cy.js', new: 'cy.js' },
  { old: 'cy-cy.jsx', new: 'cy.jsx' },
  { old: '.cy-cy.tsx', new: '.cy.tsx' },
  { old: '-cy.jsx', new: '.cy.jsx' },
  { old: '-cy.js', new: '.cy.js' },
  { old: '-cy.tsx', new: '.cy.tsx' },
  { old: '-cy.ts', new: '.cy.ts' },
]

glob(['./**/*cy-{js,jsx,ts,tsx}', './**/*-cy.{js,jsx,ts,jsx}'], { onlyFiles: true }).then((arr) => {
  // console.log(arr)
  const f = new Set()

  const towrite = []

  for (const a of new Set(arr)) {
    for (const repl of torep) {
      if (a.endsWith(repl.old) && !f.has(a)) {
        let n = a.replace(repl.old, repl.new)

        if (a !== n) {
          f.add(a)
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
