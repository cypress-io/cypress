#!/usr/bin/env tsx

import fs from 'fs'
import path from 'path'
import glob from 'glob'
import { convertExampleContent } from './convert-content'

function replaceStringsIn (file: string) {
  fs.readFile(file, 'utf8', function (err, str) {
    if (err) throw err

    fs.writeFile(file, convertExampleContent(str), function (err) {
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
