import { fromTs, tsTypeExample } from './file-types/ts-file'
import { fromTsx, tsxTypeExample } from './file-types/tsx-file'

expect(fromTs).equal('from ts')
expect(tsTypeExample.tsProp).equal('ts value')
expect(fromTsx).to.be.an('object')
expect(tsxTypeExample.tsxProp).equal('tsx value')
