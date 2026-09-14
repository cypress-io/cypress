import type * as sinon from 'sinon'

// Simulates the underlying CDP client emitting 'disconnect' by invoking every currently
// -attached listener, mirroring a real EventEmitter rather than indexing into a specific
// `.on()` call - so this stays correct regardless of how many listeners connect() registers
// or in what order. on/off calls on the same reference (e.g. reconnecting re-registers the
// same bound method) are replayed in chronological order via sinon's shared callId counter,
// and each `off` cancels exactly one matching prior `on` rather than every occurrence of
// that reference.
export const activeListeners = (onStub: sinon.SinonStub, offStub: sinon.SinonStub, event: string) => {
  const events = [
    ...onStub.getCalls().map((call) => ({ type: 'on' as const, call })),
    ...offStub.getCalls().map((call) => ({ type: 'off' as const, call })),
  ]
  .filter(({ call }) => call.args[0] === event)
  .sort((a, b) => a.call.callId - b.call.callId)

  const active: Function[] = []

  events.forEach(({ type, call }) => {
    const listener = call.args[1]

    if (type === 'on') {
      active.push(listener)

      return
    }

    const index = active.indexOf(listener)

    if (index !== -1) {
      active.splice(index, 1)
    }
  })

  return active
}

export const fireDisconnect = async (onStub: sinon.SinonStub, offStub: sinon.SinonStub) => {
  await Promise.all(activeListeners(onStub, offStub, 'disconnect').map((listener) => listener()))
}
