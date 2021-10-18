/* eslint-disable no-console */
import { colors } from '../.windicss/colors'
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

      console.log(colorName)

      for (let colorGrade in colorScale) {
        const variableNameRegExp = new RegExp(`-${colorName}-${colorGrade}`)

        contents = contents.replace(variableNameRegExp, colorScale[colorGrade])
      }
    }
    fs.writeFile(`${filePath}.json`, contents, (err) => {
      if (err) {
        throw err
      }

      console.log('cypress shiki theme generated succesfully')
    })
  })
