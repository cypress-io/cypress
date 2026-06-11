import { proxyquire } from '../../../spec_helper'
import os from 'os'
import pkg from '@packages/root'
import sinon from 'sinon'

describe('getStandardHeaders', () => {
  const loadWithMachineId = (machineId: string | null) => {
    return (proxyquire('@packages/server/lib/cloud/api/get_standard_headers', {
      '../machine_id': {
        machineId: sinon.stub().resolves(machineId),
      },
    }) as typeof import('@packages/server/lib/cloud/api/get_standard_headers')).getStandardHeaders
  }

  it('returns the standard identity headers', async () => {
    const getStandardHeaders = loadWithMachineId('test-machine-id')

    expect(await getStandardHeaders()).to.deep.equal({
      'x-os-name': os.platform(),
      'x-cypress-version': pkg.version,
      'x-machine-id': 'test-machine-id',
    })
  })

  it('falls back to an empty x-machine-id when the machine id is unavailable', async () => {
    const getStandardHeaders = loadWithMachineId(null)

    expect(await getStandardHeaders()).to.deep.equal({
      'x-os-name': os.platform(),
      'x-cypress-version': pkg.version,
      'x-machine-id': '',
    })
  })
})
