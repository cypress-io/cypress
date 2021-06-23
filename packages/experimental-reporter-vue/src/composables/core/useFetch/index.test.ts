import { useFetch, createFetch } from '.'
import fetchMock from 'jest-fetch-mock'
import { until } from '../../shared'
import { nextTick, ref } from 'vue'

describe('useFetch', () => {
  beforeEach(() => {
    fetchMock.resetMocks()
    fetchMock.enableMocks()
    fetchMock.doMock()
  })

  test('should have status code of 200 and message of Hello World', async() => {
    fetchMock.mockResponse('Hello World', { status: 200 })

    const { data, statusCode, isFinished } = useFetch('https://example.com')

    await until(isFinished).toBe(true)

    expect(statusCode.value).toBe(200)
    expect(data.value).toBe('Hello World')
  })

  test('should parse response as json', async() => {
    fetchMock.mockResponse(JSON.stringify({ message: 'Hello World' }), { status: 200 })

    const { data, isFinished } = useFetch('https://example.com').json()

    await until(isFinished).toBe(true)

    expect(data.value).toStrictEqual({ message: 'Hello World' })
  })

  test('should have an error on 400', async() => {
    fetchMock.mockResponse('', { status: 400 })

    const { error, statusCode, isFinished } = useFetch('https://example.com')

    await until(isFinished).toBe(true)

    expect(statusCode.value).toBe(400)
    expect(error.value).toBe('Bad Request')
  })

  test('should abort request and set aborted to true', async() => {
    fetchMock.mockResponse(() => new Promise(resolve => setTimeout(() => resolve({ body: 'ok' }), 1000)))

    const { aborted, abort, isFinished, execute } = useFetch('https://example.com')

    setTimeout(() => abort(), 0)

    await until(isFinished).toBe(true)
    expect(aborted.value).toBe(true)

    execute()

    setTimeout(() => abort(), 0)

    await until(isFinished).toBe(true)
    expect(aborted.value).toBe(true)
  })

  test('should not call if immediate is false', async() => {
    fetchMock.mockResponse('')

    useFetch('https://example.com', { immediate: false })
    await nextTick()

    expect(fetchMock).toBeCalledTimes(0)
  })

  test('should refetch if refetch is set to true', async() => {
    fetchMock.mockResponse('')

    const url = ref('https://example.com')
    const { isFinished } = useFetch(url, { refetch: true })

    await until(isFinished).toBe(true)
    url.value = 'https://example.com/test'
    await nextTick()
    await until(isFinished).toBe(true)

    expect(fetchMock).toBeCalledTimes(2)
  })

  test('should create an instance of useFetch with a base url', async() => {
    fetchMock.mockResponse('')

    const useMyFetch = createFetch({ baseUrl: 'https://example.com', fetchOptions: { headers: { Authorization: 'test' } } })
    const { isFinished } = useMyFetch('test', { headers: { 'Accept-Language': 'en-US' } })

    await until(isFinished).toBe(true)

    expect(fetchMock.mock.calls[0][1]!.headers).toMatchObject({ 'Authorization': 'test', 'Accept-Language': 'en-US' })
    expect(fetchMock.mock.calls[0][0]).toEqual('https://example.com/test')
  })

  test('should run the beforeFetch function and add headers to the request', async() => {
    fetchMock.mockResponse('')

    const { isFinished } = useFetch('https://example.com', { headers: { 'Accept-Language': 'en-US' } }, {
      beforeFetch({ options }) {
        options.headers = {
          ...options.headers,
          Authorization: 'my-auth-token',
        }

        return { options }
      },
    })

    await until(isFinished).toBe(true)

    expect(fetchMock.mock.calls[0][1]!.headers).toMatchObject({ 'Authorization': 'my-auth-token', 'Accept-Language': 'en-US' })
  })

  test('should run the beforeFetch function and cancel the request', async() => {
    fetchMock.mockResponse('')

    const { execute } = useFetch('https://example.com', {
      immediate: false,
      beforeFetch({ cancel }) {
        cancel()
      },
    })

    await execute()

    expect(fetchMock).toBeCalledTimes(0)
  })

  test('should run the afterFetch function', async() => {
    fetchMock.mockResponse(JSON.stringify({ title: 'HxH' }), { status: 200 })

    const { isFinished, data } = useFetch('https://example.com', {
      afterFetch(ctx) {
        if (ctx.data.title === 'HxH')
          ctx.data.title = 'Hunter x Hunter'

        return ctx
      },
    }).json()

    await until(isFinished).toBe(true)
    expect(data.value).toStrictEqual({ title: 'Hunter x Hunter' })
  })

  test('should emit onFetchResponse event', async() => {
    let didEventFire = false
    const { isFinished, onFetchResponse } = useFetch('https://example.com')

    onFetchResponse(() => {
      didEventFire = true
    })

    await until(isFinished).toBe(true)
    expect(didEventFire).toBe(true)
  })

  test('should emit onFetchResponse event', async() => {
    fetchMock.mockResponse('', { status: 200 })

    let didResponseEventFire = false
    let didErrorEventFire = false
    const { isFinished, onFetchResponse, onFetchError } = useFetch('https://example.com')

    onFetchResponse(() => didResponseEventFire = true)
    onFetchError(() => didErrorEventFire = true)

    await until(isFinished).toBe(true)
    expect(didResponseEventFire).toBe(true)
    expect(didErrorEventFire).toBe(false)
  })

  test('should emit onFetchError event', async() => {
    fetchMock.mockResponse('', { status: 400 })

    let didResponseEventFire = false
    let didErrorEventFire = false
    const { isFinished, onFetchResponse, onFetchError } = useFetch('https://example.com')

    onFetchResponse(() => didResponseEventFire = true)
    onFetchError(() => didErrorEventFire = true)

    await until(isFinished).toBe(true)
    expect(didResponseEventFire).toBe(false)
    expect(didErrorEventFire).toBe(true)
  })
})
