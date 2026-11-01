import { describe, it, expect, vi } from 'vitest'
import { SYNC_XHR_PATCH } from '../../../../lib/automation/commands/remote_sync_xhr'

const runPatchIn = ({ isTop }: { isTop: boolean }) => {
  class XMLHttpRequest {
    setRequestHeader = vi.fn()
    open (..._args: unknown[]) {}
  }

  const window: Record<string, unknown> = {}

  window.top = isTop ? window : {}

  new Function('window', 'XMLHttpRequest', SYNC_XHR_PATCH)(window, XMLHttpRequest)

  return new XMLHttpRequest()
}

describe('lib/automation/commands/remote_sync_xhr', () => {
  it('marks a synchronous XHR in a frame', () => {
    const xhr = runPatchIn({ isTop: false })

    xhr.open('GET', '/sync', false)

    expect(xhr.setRequestHeader).toHaveBeenCalledWith('x-cypress-is-sync-request', 'true')
  })

  it('leaves an asynchronous XHR alone', () => {
    const xhr = runPatchIn({ isTop: false })

    xhr.open('GET', '/async', true)
    xhr.open('GET', '/default')

    expect(xhr.setRequestHeader).not.toHaveBeenCalled()
  })

  it('leaves the runner\'s top frame alone', () => {
    const xhr = runPatchIn({ isTop: true })

    xhr.open('GET', '/sync', false)

    expect(xhr.setRequestHeader).not.toHaveBeenCalled()
  })
})
