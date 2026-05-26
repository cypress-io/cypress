import { rename } from 'fs-extra'

const MAX_RETRIES = 3
const RETRY_DELAY_MS = 100

function isRetryableError (err: unknown): err is NodeJS.ErrnoException {
  const code = typeof err === 'object' && err !== null && 'code' in err
    ? (err as NodeJS.ErrnoException).code
    : undefined

  return code === 'EPERM' || code === 'EACCES' || code === 'EBUSY'
}

function delay (ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function retryOnRenameError<T> (op: () => Promise<T>): Promise<T> {
  let lastError: unknown

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await op()
    } catch (err) {
      lastError = err
      if (attempt < MAX_RETRIES && isRetryableError(err)) {
        await delay(RETRY_DELAY_MS)
      } else {
        throw err
      }
    }
  }

  throw lastError
}

export async function renameAtomicWithRetry (src: string, dst: string): Promise<void> {
  await retryOnRenameError(() => rename(src, dst))
}
