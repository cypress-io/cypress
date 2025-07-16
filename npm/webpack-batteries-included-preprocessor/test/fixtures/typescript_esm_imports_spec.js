import { fromTs, tsTypeExample } from './file-types/ts-file.js'
import { fromMts, mtsTypeExample } from './file-types/mts-file.mjs'

expect(fromTs).equal('from ts')
expect(tsTypeExample.tsProp).equal('ts value')
expect(fromMts).equal('from mts')
expect(mtsTypeExample.mtsProp).equal('mts value')
