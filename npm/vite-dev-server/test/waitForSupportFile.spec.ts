import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getSupportFileRelativePath, waitUntilUrlReady } from '../src/waitForSupportFile'

describe('waitForSupportFile', () => {
  describe('getSupportFileRelativePath', () => {
    it('builds path matching client logic when devServerPublicPathRoute is set', () => {
      const cypressConfig = {
        projectRoot: '/users/proj',
        supportFile: '/users/proj/cypress/support/component.ts',
        devServerPublicPathRoute: '/__cypress/src',
        platform: 'darwin',
      } as Cypress.PluginConfigOptions

      expect(getSupportFileRelativePath(cypressConfig)).toBe('/__cypress/src/cypress/support/component.ts')
    })

    it('returns empty string when supportFile is not set', () => {
      const cypressConfig = {
        projectRoot: '/users/proj',
        supportFile: undefined,
        devServerPublicPathRoute: '/__cypress/src',
        platform: 'darwin',
      } as Cypress.PluginConfigOptions

      expect(getSupportFileRelativePath(cypressConfig)).toBe('')
    })

    it('handles win32 paths with backslashes', () => {
      const cypressConfig = {
        projectRoot: 'C:\\users\\proj',
        supportFile: 'C:\\users\\proj\\cypress\\support\\component.ts',
        devServerPublicPathRoute: '/__cypress/src',
        platform: 'win32',
      } as Cypress.PluginConfigOptions

      expect(getSupportFileRelativePath(cypressConfig)).toBe('/__cypress/src/cypress/support/component.ts')
    })

    it('uses relative path when devServerPublicPathRoute is empty', () => {
      const cypressConfig = {
        projectRoot: '/users/proj',
        supportFile: '/users/proj/cypress/support/component.ts',
        devServerPublicPathRoute: '',
        platform: 'darwin',
      } as Cypress.PluginConfigOptions

      expect(getSupportFileRelativePath(cypressConfig)).toBe('./cypress/support/component.ts')
    })
  })

  describe('waitUntilUrlReady', () => {
    beforeEach(() => {
      vi.stubGlobal('fetch', vi.fn())
    })

    afterEach(() => {
      vi.unstubAllGlobals()
    })

    it('resolves when URL returns 200', async () => {
      const fetchMock = vi.mocked(fetch)

      fetchMock.mockResolvedValue({ ok: true } as Response)

      await expect(waitUntilUrlReady('http://127.0.0.1:5173/__cypress/src/cypress/support/component.ts')).resolves.toBeUndefined()
      expect(fetchMock).toHaveBeenCalledTimes(1)
    })

    it('retries until 200 then resolves', async () => {
      const fetchMock = vi.mocked(fetch)

      fetchMock
      .mockResolvedValueOnce({ ok: false, status: 503 } as Response)
      .mockResolvedValueOnce({ ok: true } as Response)

      await expect(
        waitUntilUrlReady('http://127.0.0.1:5173/ready', { maxAttempts: 3, delayMs: 1 }),
      ).resolves.toBeUndefined()

      expect(fetchMock).toHaveBeenCalledTimes(2)
    })

    it('throws after maxAttempts if URL never returns 2xx', async () => {
      const fetchMock = vi.mocked(fetch)

      fetchMock.mockResolvedValue({ ok: false, status: 404 } as Response)

      await expect(
        waitUntilUrlReady('http://127.0.0.1:5173/missing', { maxAttempts: 2, delayMs: 1 }),
      ).rejects.toThrow(/did not become ready in time/)

      expect(fetchMock).toHaveBeenCalledTimes(2)
    })
  })
})
