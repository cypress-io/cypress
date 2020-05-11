import fs from 'fs'
import * as sourceMaps from '../lib/util/source-maps'

export const testSourceMap = fs.readFileSync(`${__dirname}/fixtures/test.js.map`).toString()

export const testSourceWithExternalSourceMap = fs.readFileSync(`${__dirname}/fixtures/test.js`).toString()

export const testSourceWithNoSourceMap = sourceMaps.stripMappingUrl(testSourceWithExternalSourceMap)

export const testSourceWithInlineSourceMap = sourceMaps.urlFormatter(
  `data:application/json;base64,${Buffer.from(testSourceMap).toString('base64')}`,
  testSourceWithNoSourceMap,
)

export const testHtml = fs.readFileSync(`${__dirname}/fixtures/test.html`).toString()
