import { expect } from 'chai'
import crypto from 'crypto'

import { DataContext } from '../../../src'
import { RemoteRequestDataSource } from '../../../src/sources'
import { createTestDataContext } from '../helper'

describe('RemoteRequestDataSource', () => {
  let ctx: DataContext
  let remoteRequestSource: RemoteRequestDataSource

  beforeEach(async () => {
    ctx = createTestDataContext('open')
    remoteRequestSource = new RemoteRequestDataSource()
  })

  afterEach(() => {
    ctx.destroy()
  })

  describe('makeRefetchableId', () => {
    it('creates an identifier from the fieldType, operationHash, operationVariables', () => {
      const id = remoteRequestSource.makeRefetchableId(
        'RemoteFetchableCloudProjectSpecResult',
        crypto.createHash('sha1').update('query ...').digest('hex'),
        { b: '2', a: 1 },
      )

      expect(id).to.eql('UmVtb3RlRmV0Y2hhYmxlQ2xvdWRQcm9qZWN0U3BlY1Jlc3VsdDo1Y2MyNWQ4YTM5YTY1NGViMjNiNTI1NzM0NWFiYmY0MmJlNDBjOGQxOmV5SmhJam94TENKaUlqb2lNaUo5')
      expect(Buffer.from(id, 'base64').toString('utf-8')).to.eql('RemoteFetchableCloudProjectSpecResult:5cc25d8a39a654eb23b5257345abbf42be40c8d1:eyJhIjoxLCJiIjoiMiJ9')
    })

    it('stable stringifies via stringifyVariables', () => {
      const id = remoteRequestSource.makeRefetchableId(
        'RemoteFetchableCloudProjectSpecResult',
        crypto.createHash('sha1').update('query ...').digest('hex'),
        { b: '2', a: 1 },
      )
      const id2 = remoteRequestSource.makeRefetchableId(
        'RemoteFetchableCloudProjectSpecResult',
        crypto.createHash('sha1').update('query ...').digest('hex'),
        { a: 1, b: '2' },
      )

      expect(id).to.eql(id2)
    })
  })

  describe('unpackFetchableNodeId', () => {
    it('takes the identifier created from makeRefetchableId and decodes the variables', () => {
      expect(remoteRequestSource.unpackFetchableNodeId('UmVtb3RlRmV0Y2hhYmxlQ2xvdWRQcm9qZWN0U3BlY1Jlc3VsdDo1Y2MyNWQ4YTM5YTY1NGViMjNiNTI1NzM0NWFiYmY0MmJlNDBjOGQxOmV5SmhJam94TENKaUlqb2lNaUo5')).to.eql({
        name: 'RemoteFetchableCloudProjectSpecResult',
        operationHash: '5cc25d8a39a654eb23b5257345abbf42be40c8d1',
        operationVariables: { a: 1, b: '2' },
      })
    })
  })
})
