const fs = require('fs')
const path = require('path')
const glob = require('globby')

glob('./**/*cy.js').then(arr => {
  console.log(arr)

  let i = 0
  const towrite = []
  for (const a of arr) {
  console.log(i)
  i++
    if (a.endsWith('/cy-cy.js')) {
      const n = a.replace('/cy-cy.js', '/spec.cy.js')
      towrite.push({ a, n })
    } else if (a.endsWith('.cy-cy.js')) {
      const n = a.replace('.cy-cy.js', '.cy.js')
      towrite.push({ a, n })
    } else {
      towrite.push({ a, n: a })
    }
  }


  for (const { a, n } of towrite) {
    fs.renameSync(a, n)
  }
})

