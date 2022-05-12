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
        'RemoteFetchableCloudProjectSpec',
        crypto.createHash('sha1').update('query ...').digest('hex'),
        { b: '2', a: 1 },
      )

      expect(id).to.eql('UmVtb3RlRmV0Y2hhYmxlQ2xvdWRVc2VyOjVjYzI1ZDhhMzlhNjU0ZWIyM2I1MjU3MzQ1YWJiZjQyYmU0MGM4ZDE6ZXlKaElqb3hMQ0ppSWpvaU1pSjk=')
      expect(Buffer.from(id, 'base64').toString('utf-8')).to.eql('RemoteFetchableCloudProjectSpec:5cc25d8a39a654eb23b5257345abbf42be40c8d1:eyJhIjoxLCJiIjoiMiJ9')
    })

    it('stable stringifies via stringifyVariables', () => {
      const id = remoteRequestSource.makeRefetchableId(
        'RemoteFetchableCloudProjectSpec',
        crypto.createHash('sha1').update('query ...').digest('hex'),
        { b: '2', a: 1 },
      )
      const id2 = remoteRequestSource.makeRefetchableId(
        'RemoteFetchableCloudProjectSpec',
        crypto.createHash('sha1').update('query ...').digest('hex'),
        { a: 1, b: '2' },
      )

      expect(id).to.eql(id2)
    })
  })

  describe('unpackFetchableNodeId', () => {
    it('takes the identifier created from makeRefetchableId and decodes the variables', () => {
      expect(remoteRequestSource.unpackFetchableNodeId('UmVtb3RlRmV0Y2hhYmxlQ2xvdWRVc2VyOjVjYzI1ZDhhMzlhNjU0ZWIyM2I1MjU3MzQ1YWJiZjQyYmU0MGM4ZDE6ZXlKaElqb3hMQ0ppSWpvaU1pSjk=')).to.eql({
        name: 'RemoteFetchableCloudProjectSpec',
        operationHash: '5cc25d8a39a654eb23b5257345abbf42be40c8d1',
        operationVariables: { a: 1, b: '2' },
      })
    })
  })

  describe('batchResolveRemoteFields', () => {
    it('')
  })

  describe('loadRemoteFetchable', () => {
    it('')
  })

  describe('shouldEagerFetch', () => {
    it('determines if the field should be eager fetched', () => {
      //
    })
  })
})
