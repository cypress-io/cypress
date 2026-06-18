import { CDPNetworkInterception } from '@packages/browser-automation'
import {
  createFetchPausedEvent,
  createFetchResponsePausedEvent,
  FakeCriClient,
} from '@packages/browser-automation/lib/testing/fake-cri-client'
import { createHttpInterceptWithDefaultMiddleware } from '@packages/network-interception'
import {
  createDriverAdapter,
  netStubbingState,
} from '@packages/net-stubbing'
import { expect, sinon } from '../../spec_helper'

async function waitFor (assertion: () => void, timeout = 5000) {
  const start = Date.now()

  while (Date.now() - start < timeout) {
    try {
      assertion()

      return
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 10))
    }
  }

  assertion()
}

async function completeCdpForwardPath (client: FakeCriClient, requestId = 'req-1') {
  await waitFor(() => {
    expect(client.getCommands('Fetch.continueRequest')).to.have.length(1)
  })

  client.emit('Fetch.requestPaused', createFetchResponsePausedEvent({ requestId }))

  await waitFor(() => {
    expect(client.getCommands('Fetch.fulfillRequest')).to.have.length(1)
  })
}

function createServerCdpInterceptFixture () {
  const stubbing = netStubbingState()
  const socket = { toDriver: sinon.stub() }
  const getFixture = sinon.stub().resolves('')
  const httpIntercept = createHttpInterceptWithDefaultMiddleware({
    blockHosts: null,
    experimentalCspAllowList: false,
  }, {
    matchesBlockedHost: () => false,
  })
  const driverAdapter = createDriverAdapter({
    stubbing,
    socket,
    httpIntercept,
  })
  const client = new FakeCriClient()
  const interception = new CDPNetworkInterception(driverAdapter.httpIntercept, client)
  const registration = driverAdapter.createInterceptRegistration({ getFixture })

  return {
    stubbing,
    socket,
    getFixture,
    driverAdapter,
    client,
    interception,
    registration,
    interceptionEvents: driverAdapter.interceptionEvents,
  }
}

async function addRoute (registration: ReturnType<typeof createServerCdpInterceptFixture>['registration'], options: {
  routeId: string
  hasInterceptor: boolean
  staticResponse?: { statusCode: number, body: string }
}) {
  await registration.handleEvent({
    eventName: 'route:added',
    frame: {
      routeId: options.routeId,
      hasInterceptor: options.hasInterceptor,
      routeMatcher: { url: { type: 'glob', value: '*' } },
      staticResponse: options.staticResponse,
    },
  })
}

describe('CDP cy.intercept integration', function () {
  it('fulfills request-stage static stub routes without continuing to origin', async function () {
    const { client, interception, registration } = createServerCdpInterceptFixture()

    await addRoute(registration, {
      routeId: 'route-1',
      hasInterceptor: false,
      staticResponse: {
        statusCode: 201,
        body: 'stubbed',
      },
    })

    await interception.enable()
    client.emit('Fetch.requestPaused', createFetchPausedEvent())

    await waitFor(() => {
      expect(client.getCommands('Fetch.fulfillRequest')).to.have.length(1)
    })

    expect(client.getCommands('Fetch.continueRequest')).to.have.length(0)
    expect(client.getLastCommand('Fetch.fulfillRequest')?.params).to.include({
      requestId: 'req-1',
      responseCode: 201,
      body: Buffer.from('stubbed').toString('base64'),
    })
  })

  it('fulfills request-stage driver static reply without continuing to origin', async function () {
    const { stubbing, socket, client, interception, registration } = createServerCdpInterceptFixture()

    await addRoute(registration, {
      routeId: 'route-1',
      hasInterceptor: true,
    })

    await interception.enable()
    client.emit('Fetch.requestPaused', createFetchPausedEvent({ requestId: 'req-42' }))

    await waitFor(() => {
      expect(socket.toDriver).to.have.been.called
    })

    const beforeRequestFrame = socket.toDriver.getCalls().find((call) => call.args[1] === 'before:request')?.args[2] as {
      eventId: string
      requestId: string
      browserRequestId: string
    }

    expect(beforeRequestFrame.requestId).to.be.a('string')
    expect(beforeRequestFrame.browserRequestId).to.eq('req-42')

    await registration.handleEvent({
      eventName: 'send:static:response',
      frame: {
        requestId: beforeRequestFrame.requestId,
        staticResponse: {
          statusCode: 200,
          body: 'driver-replaced',
        },
      },
    })

    await waitFor(() => {
      expect(client.getCommands('Fetch.fulfillRequest')).to.have.length(1)
    })

    expect(client.getCommands('Fetch.continueRequest')).to.have.length(0)
    expect(client.getLastCommand('Fetch.fulfillRequest')?.params).to.include({
      requestId: 'req-42',
      responseCode: 200,
      body: Buffer.from('driver-replaced').toString('base64'),
    })

    expect(stubbing.pendingEventHandlers[beforeRequestFrame.eventId]).to.be.undefined
  })

  it('correlates CDP requestId through driver before:request events', async function () {
    const { stubbing, socket, client, interception, registration, interceptionEvents } = createServerCdpInterceptFixture()

    await addRoute(registration, {
      routeId: 'route-1',
      hasInterceptor: true,
    })

    client.setResponseBody('req-77', 'origin-body')

    await interception.enable()
    client.emit('Fetch.requestPaused', createFetchPausedEvent({ requestId: 'req-77' }))

    await waitFor(() => {
      expect(socket.toDriver).to.have.been.called
    })

    const beforeRequestCall = socket.toDriver.getCalls().find((call) => call.args[1] === 'before:request')

    expect(beforeRequestCall?.args[2]).to.include({
      browserRequestId: 'req-77',
    })

    expect(beforeRequestCall?.args[2]).to.have.property('requestId')

    const { eventId } = beforeRequestCall!.args[2] as { eventId: string }

    interceptionEvents.resolveEventHandler({
      eventId,
      stopPropagation: false,
    })

    await completeCdpForwardPath(client, 'req-77')

    expect(stubbing.routes[0].matches).to.eq(1)
  })

  it('applies response-stage driver reply on the forward path', async function () {
    const stubbing = netStubbingState()
    const socket = { toDriver: sinon.stub() }
    const getFixture = sinon.stub().resolves('')
    let capturedInFlightId = ''
    const httpIntercept = createHttpInterceptWithDefaultMiddleware({
      blockHosts: null,
      experimentalCspAllowList: false,
    }, {
      matchesBlockedHost: () => false,
    })
    const driverAdapter = createDriverAdapter({
      stubbing,
      socket,
      httpIntercept,
    })
    const registration = driverAdapter.createInterceptRegistration({ getFixture })

    sinon.stub(driverAdapter.interceptionEvents, 'emitAndAwait').callsFake(async (eventName: string, frame: { requestId: string }) => {
      if (eventName === 'before:request') {
        capturedInFlightId = frame.requestId
      }

      return {}
    })

    sinon.stub(driverAdapter.interceptionEvents, 'emit').callsFake((eventName: string) => {
      if (eventName === 'response:callback') {
        void registration.handleEvent({
          eventName: 'send:static:response',
          frame: {
            requestId: capturedInFlightId,
            staticResponse: {
              statusCode: 200,
              body: 'replaced-at-response',
            },
          },
        })
      }
    })

    const client = new FakeCriClient()

    client.setResponseBody('req-1', 'origin-body')

    const interception = new CDPNetworkInterception(driverAdapter.httpIntercept, client)

    await addRoute(registration, {
      routeId: 'route-1',
      hasInterceptor: true,
    })

    await interception.enable()
    client.emit('Fetch.requestPaused', createFetchPausedEvent())
    await completeCdpForwardPath(client)

    expect(client.getLastCommand('Fetch.fulfillRequest')?.params).to.include({
      requestId: 'req-1',
      responseCode: 200,
      body: Buffer.from('replaced-at-response').toString('base64'),
    })
  })

  it('runs response-stage subscriptions when the adapter drives next()', async function () {
    const stubbing = netStubbingState()
    const socket = { toDriver: sinon.stub() }
    const getFixture = sinon.stub().resolves('')
    const httpIntercept = createHttpInterceptWithDefaultMiddleware({
      blockHosts: null,
      experimentalCspAllowList: false,
    }, {
      matchesBlockedHost: () => false,
    })
    const driverAdapter = createDriverAdapter({
      stubbing,
      socket,
      httpIntercept,
    })
    const emit = sinon.stub()
    const emitAndAwait = sinon.stub().resolves({})

    sinon.stub(driverAdapter.interceptionEvents, 'emit').callsFake(emit)
    sinon.stub(driverAdapter.interceptionEvents, 'emitAndAwait').callsFake(emitAndAwait)

    const registration = driverAdapter.createInterceptRegistration({ getFixture })

    await addRoute(registration, {
      routeId: 'route-1',
      hasInterceptor: true,
    })

    const client = new FakeCriClient()

    client.setResponseBody('req-1', 'origin-body')

    const interception = new CDPNetworkInterception(driverAdapter.httpIntercept, client)

    await interception.enable()
    client.emit('Fetch.requestPaused', createFetchPausedEvent())

    await waitFor(() => {
      expect(client.getCommands('Fetch.continueRequest')).to.have.length(1)
    })

    client.emit('Fetch.requestPaused', createFetchResponsePausedEvent())

    await waitFor(() => {
      expect(client.getCommands('Fetch.fulfillRequest')).to.have.length(1)
    })

    expect(emitAndAwait).to.have.been.calledWith('before:request', sinon.match({
      browserRequestId: 'req-1',
    }))

    const emittedEvents = emit.getCalls().map((call) => call.args[0])

    expect(emittedEvents).to.include('response:callback')
    expect(emittedEvents).to.include('after:response')

    expect(client.getLastCommand('Fetch.fulfillRequest')?.params).to.include({
      requestId: 'req-1',
      responseCode: 200,
      body: Buffer.from('origin-body').toString('base64'),
    })
  })
})
