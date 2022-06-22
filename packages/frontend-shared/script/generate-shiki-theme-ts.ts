/* eslint-disable no-console */
import { colors } from '@cypress-design/css'
import * as fs from 'fs'

const filePath = './src/public/shiki/themes/cypress.theme'

fs.readFile(`${filePath}.template.json`,
  { encoding: 'utf8' },
  (err, contents) => {
    if (err) {
      throw err
    }

    for (let colorName in colors) {
      const colorScale = colors[colorName]

      for (let colorGrade in colorScale) {
        const variableNameRegExp = new RegExp(`-${colorName}-${colorGrade}"`, 'g')

        contents = contents.replace(variableNameRegExp, `${colorScale[colorGrade]}"`)
      }
    }
    fs.writeFile(`${filePath}.json`, contents, (err) => {
      if (err) {
        throw err
      }

      console.log(`${filePath}.json generated successfully`)
    })
  })
