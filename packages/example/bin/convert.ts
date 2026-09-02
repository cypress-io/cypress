#!/usr/bin/env tsx

/* eslint-disable quotes */

import fs from 'fs'
import path from 'path'
import glob from 'glob'

const eslintRe = /\/. eslint.+\s+/g

function replaceStringsIn (file: string) {
  fs.readFile(file, 'utf8', function (err, str) {
    if (err) throw err

    const replace = function (source: string | RegExp, dest: string) {
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
