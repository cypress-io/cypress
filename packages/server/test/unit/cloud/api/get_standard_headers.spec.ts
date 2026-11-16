import os from 'os'
import pkg from '@packages/root'
import { describe, expect, it, vi } from 'vitest'

import { getStandardHeaders } from '../../../../lib/cloud/api/get_standard_headers'

const { machineId } = vi.hoisted(() => {
  return { machineId: vi.fn() }
})

vi.mock('../../../../lib/cloud/machine_id', () => {
  return { machineId }
})

describe('getStandardHeaders', () => {
  it('returns the standard identity headers', async () => {
    machineId.mockResolvedValue('test-machine-id')

    expect(await getStandardHeaders()).toStrictEqual({
      'x-os-name': os.platform(),
      'x-cypress-version': pkg.version,
      'x-machine-id': 'test-machine-id',
    })
  })

  it('falls back to an empty x-machine-id when the machine id is unavailable', async () => {
    machineId.mockResolvedValue(null)

    expect(await getStandardHeaders()).toStrictEqual({
      'x-os-name': os.platform(),
      'x-cypress-version': pkg.version,
      'x-machine-id': '',
    })
  })
})
