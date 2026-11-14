import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { processDetectorSync as otelProcessDetectorSync, Resource } from '@opentelemetry/resources'
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions'
import { processDetectorSync, redactCommandArgs, REDACTED } from '../../src/detectors/processDetectorSync'

describe('redactCommandArgs', () => {
  it('keeps the executable and flag names and replaces every value', () => {
    expect(redactCommandArgs([
      '/path/to/Cypress',
      '--key=record-key',
      '--env={"apiToken":"secret"}',
      '--apiKey=secret',
      '--record',
      '--key',
      'record-key',
      'index.js',
    ])).toEqual([
      '/path/to/Cypress',
      `--key=${REDACTED}`,
      `--env=${REDACTED}`,
      `--apiKey=${REDACTED}`,
      '--record',
      '--key',
      REDACTED,
      REDACTED,
    ])
  })

  it('keeps an argument list that is only the executable', () => {
    expect(redactCommandArgs(['/path/to/Cypress'])).toEqual(['/path/to/Cypress'])
  })
})

describe('processDetectorSync', () => {
  let argv: string[]

  beforeEach(() => {
    argv = process.argv
  })

  afterEach(() => {
    process.argv = argv
    vi.restoreAllMocks()
  })

  it('redacts argument values in the command args and the command', () => {
    process.argv = ['/path/to/Cypress', '--apiKey=secret', '--key=secret2', '--env={"token":"secret3"}']

    const { attributes } = processDetectorSync.detect()

    expect(attributes[SemanticResourceAttributes.PROCESS_COMMAND]).toBe(`--apiKey=${REDACTED}`)
    expect(attributes[SemanticResourceAttributes.PROCESS_COMMAND_ARGS]).toEqual(expect.arrayContaining([
      `--apiKey=${REDACTED}`,
      `--key=${REDACTED}`,
      `--env=${REDACTED}`,
    ]))

    expect(JSON.stringify(attributes)).not.toContain('secret')
  })

  it('keeps the other process attributes', () => {
    const { attributes } = processDetectorSync.detect()

    expect(attributes[SemanticResourceAttributes.PROCESS_PID]).toBe(process.pid)
    expect(attributes[SemanticResourceAttributes.PROCESS_RUNTIME_NAME]).toBe('nodejs')
  })

  it('drops command line attributes it cannot redact', () => {
    vi.spyOn(otelProcessDetectorSync, 'detect').mockReturnValue(new Resource({
      [SemanticResourceAttributes.PROCESS_PID]: 1,
      [SemanticResourceAttributes.PROCESS_COMMAND_ARGS]: 'node --key=secret',
      [SemanticResourceAttributes.PROCESS_COMMAND_LINE]: 'node --key=secret',
    }))

    const { attributes } = processDetectorSync.detect()

    expect(attributes).toEqual({ [SemanticResourceAttributes.PROCESS_PID]: 1 })
  })
})
