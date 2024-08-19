import path from 'path'
import { gzipSync } from 'zlib'
import crypto from 'crypto'
import base64Url from 'base64url'
import esbuild from 'esbuild'

export const SYSTEM_TESTS_PRIVATE = 'LS0tLS1CRUdJTiBQUklWQVRFIEtFWS0tLS0tCk1JSUV2UUlCQURBTkJna3Foa2lHOXcwQkFRRUZBQVNDQktjd2dnU2pBZ0VBQW9JQkFRQ3VBa1docWZSTTB3dFUKZ0toNXE5Z2hTU1BsdG5kM1UxUWk1VHhuZm1pR3lvQVZlL25HRkFidkxXQjNMaTRoVTBkVGlSTjg4TUIwam5hMQpXbHIwK2F1YzBmeVYwMTNiaW5ONFRxWUhFNjdaUUlKYkJNWDNMOEE5K1BybDJ6WkVqZlFZNkYraklKbXNIQ29RCnl5NXU3WGxSS09VOU9rQ0ZsQmp0L3FXbnd6b3RvM0lnY3JmcmJUejkxbk9LVHdKSXBtWGFRRGd3TEhLVm84aFgKbFJWMmI0UjIvWnErWWF6K2dMbE5aUkR2MVFsdXZUMTdPYUY1cldyL2xYT2lQaWp6MGtrS0ROQnF0aWo5UDdsaQpUSnUyQ0YzZkRxdzRuUUVKeVJBVExTTlpSdFZIRkdRN3hOdVdzdGFYOURBT3ZCRDhNTStFVmtlRWVYNEgrdEExCmFWclZhMG10QWdNQkFBRUNnZ0VBWW9OWXhwakFmWW54M1NwbHQxU0pyUGFLZ3krVlhSSHBEVVI0dVNNQXJHY1MKc3BjWXBvS0tGbmk3SjE0V3NibERKVkR5bm9aeWZzcDAvR0VtSTVFQ0RtdDNzNThSZ1F4V0tTTmxyWllBSkhENApHKzJNNGsrL1o1YUEvUWJwSjFDeWhETnlpWmtZUnk4K3hYa3lWWXpPWlJ0aEJSUG9tWGRwMGJ1Y0wybEFrN3NJCnVTUWIreTJtTUFXY1Q2UmRpYnFqcnNNMkE5YW1PQWc1bHd4L3NQUHRTbEdmVkZ6eExQYklDK3o3UmR1eWcyVEwKOXhnZkV5c0Y2dkpxSzJieW1pNGprd3dVZnhFRHluTmtIbEwzR1NsQlE1TkxnVjRVaXhrWEhKZ21OY041OERGTwpwT1NHQzAxMkNOVjQ4b3Fuc3VObEVjeVZhbTVSZk1iWXlCRm5PQVF5WlFLQmdRRGUxNmdISUk3Yk1VaXVLZHBwClV0YU8vMTNjMzlqQXFIcnllVnQ5UUhaTjU5aXdGZlN1N3kzZlYzVlFZRWJYZVpIU1ZkbC9uakhYTmRaaHdtbmUKWlcvZ3UzbHo4TlVjSElhaWZuT2RVSEh0czY2bjFlYUNvZDN0T29VYkhVUEhqYUl2L0F6ZlZTNWtBNzB6RTh6RApRNW5qS2JEc1hucExKY0QrV25VYzVIUlNjd0tCZ1FESDVueGZBaGkxckppQk1TeUpJYkZjUTl0dVVMT3JiQk9mCkZSeVArQzZybi9kZndvb09vL2lvaHJvT3FPSnVZTG9oTTltN1NvaHNpU3R2bG1VVEl3YlVTd1NNR00yMFdlK1cKR0ZjT01rQlk5NFVXdHF2aDlDaGMycmV6NkNDZE1VQkNHaVlMQ1V1SGp4ZDZqZ3ZZbG5vS2xsZzVBakJ2aUJDbApNM0VNZ2tOTFh3S0JnUUNwUVNGRmNJd3duZWszSjJEVjJHNVFwRk0xZk91VHdTUEk0VFlGRng0RUpCRm9CUFVZCm5WKzVJQ05oamc2Z2dKeXFKanlSZXFVZWNheklDYk1Ca1FmOXFFY2lNWXliMG1yTUpzRkhmaDlhVEx4ZWk4K04KN3NXeDlsMjg3MmhZdkJHdzRuOGdiZ0ZUUTZmRGtNbFlraExpLy9wNlBYUWplYVJ4VEdGaE5YL0lVd0tCZ0dKeQpyTVhOcm9XcW51RGhhdUdPYWw3YVBITXo0NGlGRFpUSFBPM2FlSUdsb3ByU29GTmRoZFRacFVBYkJJai9zaXN2CjhnYy9TYmpLUlU0TGIzUGhTRGU5U2x3RXl5b0xNT2RtelZqOGZweFNLb1ZwS1hWNlhYWjljUU4xU3JxZnl0bkQKTHdFNGJxNHdWb3ZROFJ5VjN6emZsa3RkUEtWeENXR1MyQllsQVNkWkFvR0FGRjliM2QvRko4Rm0rS25qNlhTaAozT3FuZlJ6NGRLN042bkxIUGdxelBGdVdiVWVPRGY1dTkrN3NpUVlNVkZyRWlZUlNvRStqc0FWREhBb1dIZ1Q3CmZlM2lUNzZuZVlHWVd3M1VwTjdQby9udTNiT3FWUzZSUEs0L05wZ0ZuM1ZzTUdyRTVKVVY5N0Z1Q1NKNHM4Wk8KTzJnWnBRdVpHQm40Und0LzEwOXdEYTQ9Ci0tLS0tRU5EIFBSSVZBVEUgS0VZLS0tLS0='

export const TEST_PRIVATE = crypto.createPrivateKey(Buffer.from(SYSTEM_TESTS_PRIVATE, 'base64').toString('utf8'))

const build = (filename: string): string => {
  const { outputFiles: [{ contents }] } = esbuild.buildSync({
    entryPoints: [path.join(__dirname, filename)],
    bundle: true,
    format: 'cjs',
    write: false,
    platform: 'node',
  })

  return new TextDecoder('utf-8').decode(contents)
}

const hash = (stub: string): string => {
  return base64Url.fromBase64(crypto.createHash('SHA256').update(stub).digest('base64'))
}

const sign = (stub: string): string => {
  return base64Url.fromBase64(crypto.createSign('SHA256').update(stub).sign(TEST_PRIVATE, 'base64'))
}

const stub = (filename: string) => {
  const value = build(filename)

  return {
    value,
    compressed: gzipSync(value),
    hash: hash(value),
    sign: sign(value),
  }
}

export const PROTOCOL_STUB_VALID = stub('protocolStub.ts')

export const PROTOCOL_STUB_CONSTRUCTOR_ERROR = stub('protocolStubWithRuntimeError.ts')

export const PROTOCOL_STUB_BEFORESPEC_ERROR = stub('protocolStubWithBeforeSpecError.ts')

export const PROTOCOL_STUB_NONFATAL_ERROR = stub('protocolStubWithNonFatalError.ts')

export const PROTOCOL_STUB_BEFORETEST_ERROR = stub('protocolStubWithBeforeTestError.ts')

export const PROTOCOL_STUB_FONT_FLOODING = stub('protocolStubFontFlooding.ts')

export const PROTOCOL_STUB_SERVICE_WORKER = stub('protocolStubServiceWorker.ts')

export const PROTOCOL_STUB_NO_DB_WRITE = stub('protocolStubWithMissingArchive.ts')
