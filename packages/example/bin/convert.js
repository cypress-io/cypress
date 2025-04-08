#!/usr/bin/env node

/* eslint-disable quotes */

const fs = require('fs')
const path = require('path')
const glob = require('glob')

const eslintRe = /\/. eslint.+\s+/g

function replaceStringsIn (file) {
  fs.readFile(file, 'utf8', function (err, str) {
    if (err) throw err

    const replace = function (source, dest) {
      str = str.split(source).join(dest)
    }

    replace('http://localhost:8080', 'https://example.cypress.io')
    replace("to.eq('localhost:8080')", "to.eq('example.cypress.io')")
    replace("to.eq('localhost')", "to.eq('example.cypress.io')")
    replace("to.eq('8080')", "to.eq('')")
    replace("to.eq('http:')", "to.eq('https:')")
    replace(eslintRe, "")
    replace("imgSrcToDataURL('/assets", "imgSrcToDataURL('https://example.cypress.io/assets")

    fs.writeFile(file, str, function (err) {
      if (err) throw err

      // eslint-disable-next-line no-console
      console.log(`Converted ${path.relative(process.cwd(), file)} successfully.`)
    })
  })
}

glob('./app/**/*.html', { realpath: true }, (err, htmlFiles) => {
  if (err) throw err

  glob('./cypress/e2e/**/*.js', { realpath: true }, (err, specFiles) => {
    if (err) throw err

    htmlFiles.concat(specFiles).forEach(function (file) {
      return replaceStringsIn(file)
    })
  })
})
