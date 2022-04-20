import proxyquire from 'proxyquire'
import fsExtra from 'fs-extra'
import sinon from 'sinon'
import path from 'path'
import { expect } from 'chai'
import dedent from 'dedent'

const stub = sinon.stub()

beforeEach(() => {
  stub.reset()
})

const { addTestingTypeToCypressConfig } = proxyquire('../../src/ast-utils/addToCypressConfig', {
  'fs-extra': {
    ...fsExtra,
    writeFile: stub,
  },
}) as typeof import('../../src/ast-utils/addToCypressConfig')

describe('addToCypressConfig', () => {
  it('will create a file if the file is empty', async () => {
    const result = await addTestingTypeToCypressConfig({
      filePath: path.join(__dirname, '../__fixtures__/empty.config.ts'),
      info: {
        testingType: 'e2e',
      },
    })

    expect(stub.firstCall.args[1].trim()).to.eq(dedent`
      const { defineConfig } = require("cypress");

      module.exports = defineConfig({
        e2e: {}
      });
    `)

    expect(result.result).to.eq('ADDED')
  })

  it('will error if we are unable to add to the config', async () => {
    const result = await addTestingTypeToCypressConfig({
      filePath: path.join(__dirname, '../__fixtures__/invalid.config.ts'),
      info: {
        testingType: 'e2e',
      },
    })

    expect(result.result).to.eq('NEEDS_MERGE')
    expect(result.error.message).to.eq('Unable to automerge with the config file')
  })

  it('will error if the key we are adding already exists', async () => {
    const result = await addTestingTypeToCypressConfig({
      filePath: path.join(__dirname, '../__fixtures__/has-e2e.config.ts'),
      info: {
        testingType: 'e2e',
      },
    })

    expect(result.result).to.eq('NEEDS_MERGE')
    expect(result.error.message).to.eq('Unable to automerge with the config file')
  })
})
