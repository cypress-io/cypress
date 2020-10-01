import { vol } from 'memfs'

// it is required to not forget to include the mock setting @see /__mocks__/fs.js
jest.mock('fs')

export const clearMockedFs = () => {
  vol.reset()
}

export function mockFs(
  fsConfig: Record<string, string>,
  options?: { cwd: string },
) {
  return vol.fromJSON(fsConfig, options?.cwd ?? '/')
}
