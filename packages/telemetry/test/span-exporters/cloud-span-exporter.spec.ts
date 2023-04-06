import { expect } from 'chai'
// import sinon from 'sinon'

import { OTLPTraceExporter } from '../../src/span-exporters/cloud-span-exporter'

// import * as expbase from '@opentelemetry/otlp-exporter-base'

const genericRequest = { encryption: { encryptRequest: ({ url, method, body }: {url: string, method: string, body: string}) => Promise.resolve({ jwe: 'req' }) } }

describe('cloudSpanExporter', () => {
  describe('new', () => {
    it('sets encrypted header if set', () => {
      const exporter = new OTLPTraceExporter(genericRequest)

      expect(exporter.headers['x-cypress-encrypted']).to.equal('1')
      expect(exporter.enc).to.not.be.undefined
    })

    it('does not set encrypted header if not set', () => {
      const exporter = new OTLPTraceExporter()

      expect(exporter.headers['x-cypress-encrypted']).to.be.undefined
      expect(exporter.enc).to.be.undefined
    })
  })

  describe('attachProjectId', () => {
    it('sets the project id header', () => {
      const exporter = new OTLPTraceExporter()

      let callCount = 0

      exporter.sendDelayedItems = () => {
        callCount++
      }

      expect(exporter.headers['x-project-id']).to.be.undefined

      exporter.attachProjectId('123')

      expect(exporter.headers['x-project-id']).to.equal('123')
      expect(callCount).to.equal(1)
    })

    it('does nothing if id is not passed', () => {
      const exporter = new OTLPTraceExporter()

      let callCount = 0

      exporter.sendDelayedItems = () => {
        callCount++
      }

      expect(exporter.headers['x-project-id']).to.be.undefined

      exporter.attachProjectId(undefined)

      expect(exporter.headers['x-project-id']).to.be.undefined
      expect(callCount).to.equal(0)
    })
  })

  describe('attachRecordKey', () => {
    it('sets the record key header', () => {
      const exporter = new OTLPTraceExporter()

      let callCount = 0

      exporter.sendDelayedItems = () => {
        callCount++
      }

      expect(exporter.headers['x-record-key']).to.be.undefined

      exporter.attachRecordKey('123')

      expect(exporter.headers['x-record-key']).to.equal('123')
      expect(callCount).to.equal(1)
    })

    it('does nothing if record key is not passed', () => {
      const exporter = new OTLPTraceExporter()

      let callCount = 0

      exporter.sendDelayedItems = () => {
        callCount++
      }

      expect(exporter.headers['x-record-key']).to.be.undefined

      exporter.attachRecordKey(undefined)

      expect(exporter.headers['x-record-key']).to.be.undefined
      expect(callCount).to.equal(0)
    })
  })

  describe('sendDelayedItems', () => {
    it('does not send if both project id and record key are not set', () => {
      const exporter = new OTLPTraceExporter()

      let callCount = 0

      exporter.send = () => {
        callCount++
      }

      exporter.delayedItemsToExport.push({
        serviceRequest: 'req',
        onSuccess: () => {},
        onError: () => {},
      })

      exporter.sendDelayedItems()

      expect(callCount).to.equal(0)
      expect(exporter.delayedItemsToExport.length).to.equal(1)
    })

    it('does not send if project id is not set', () => {
      const exporter = new OTLPTraceExporter()

      let callCount = 0

      exporter.send = () => {
        callCount++
      }

      exporter.delayedItemsToExport.push({
        serviceRequest: 'req',
        onSuccess: () => {},
        onError: () => {},
      })

      exporter.attachRecordKey('123')
      exporter.sendDelayedItems()

      expect(callCount).to.equal(0)
      expect(exporter.delayedItemsToExport.length).to.equal(1)
    })

    it('does not send if record key is not set', () => {
      const exporter = new OTLPTraceExporter()

      let callCount = 0

      exporter.send = () => {
        callCount++
      }

      exporter.delayedItemsToExport.push({
        serviceRequest: 'req',
        onSuccess: () => {},
        onError: () => {},
      })

      exporter.attachProjectId('123')
      exporter.sendDelayedItems()

      expect(callCount).to.equal(0)
      expect(exporter.delayedItemsToExport.length).to.equal(1)
    })

    it('does send if record key and project id are set', () => {
      const exporter = new OTLPTraceExporter()

      let callCount = 0

      exporter.send = () => {
        callCount++
      }

      exporter.delayedItemsToExport.push({
        serviceRequest: 'req',
        onSuccess: () => {},
        onError: () => {},
      })

      exporter.attachProjectId('123')
      exporter.attachRecordKey('123')
      exporter.sendDelayedItems()

      expect(callCount).to.equal(1)
      expect(exporter.delayedItemsToExport.length).to.equal(0)
    })
  })
})
