/**
 * @vitest-environment node
 */

import { describe, it, expect } from 'vitest'
import vm from 'vm'
import { Buffer } from 'buffer'
import { encode, decode, encodeEventParts } from '@packages/socket/lib/utils'

import { encodeOptionsAsSent } from '../../../src/util/privileged_channel'

// mirrors how the server re-encodes the options it receives over the CDP socket transport
const encodeReceived = async (options: unknown) => {
  const encoded = JSON.parse(JSON.stringify(await encode(['run:privileged', options], '/default')))
  const [, received] = await decode(encoded)
  const [packet, ...binaries] = encodeEventParts(received ?? null)

  return {
    packet,
    binaries: binaries.map((binary) => new Uint8Array(binary.buffer, binary.byteOffset, binary.byteLength)),
  }
}

const circular: Record<string, unknown> = { name: 'circular' }

circular.self = circular

const shared = { value: 1 }

const optionsList = [
  undefined,
  { file: 'foo.json', encoding: null },
  { task: 'foo', arg: undefined, timeout: 2500 },
  { task: 'foo', arg: { date: new Date(0), nested: [1, 'two', null, { deep: true }], nan: NaN } },
  { fileName: 'foo.bin', contents: Buffer.from('contents'), encoding: null, flag: 'w' },
  { task: 'foo', arg: new ArrayBuffer(10) },
  { task: 'foo', arg: new Uint8Array([98, 97, 122]) },
  { task: 'foo', arg: new Uint16Array([1, 256]).subarray(1) },
  { task: 'foo', arg: new DataView(new ArrayBuffer(4), 1, 2) },
  { task: 'foo', arg: { date: new Date(0), contents: Buffer.from('a'), json: { toJSON: () => 'json' } } },
  { task: 'foo', arg: circular },
  { task: 'foo', arg: [shared, shared] },
  { files: [{ path: 'cypress/fixtures/valid.json' }] },
]

describe('src/util/privileged_channel', () => {
  describe('encodeOptionsAsSent', () => {
    it('encodes options the way the server re-encodes them once received', async () => {
      for (const options of optionsList) {
        expect(await encodeOptionsAsSent(options)).toEqual(await encodeReceived(options))
      }
    })

    it('encodes an ArrayBuffer from another realm as binary', async () => {
      const { binaries } = await encodeOptionsAsSent({ task: 'foo', arg: new (vm.runInNewContext('ArrayBuffer'))(2) })

      expect(binaries).toEqual([new Uint8Array([0, 0])])
    })

    it('encodes a Blob as binary', async () => {
      const { binaries } = await encodeOptionsAsSent({ task: 'foo', arg: [new Blob(['ab']), new Blob(['c'])] })

      expect(binaries).toEqual([new Uint8Array([97, 98]), new Uint8Array([99])])
    })
  })
})
