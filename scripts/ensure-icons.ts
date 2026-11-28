import fs from 'node:fs/promises'
import path from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'

interface WaitOptions {
  freq: number
  maxAttempts: number
}

export async function waitUntilExists (dir: string, { freq, maxAttempts }: WaitOptions): Promise<void> {
  let lastError: unknown

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    // Any error is retried, not just ENOENT: the icons build deletes and recreates
    // `dist/`, and Windows reports a directory that is mid-delete as EPERM
    try {
      await fs.access(dir)

      return
    } catch (err) {
      lastError = err
    }

    if (attempt < maxAttempts) {
      console.log(`[scripts/ensure-icons]: ${dir} not found. Will check again in ${freq}ms. Attempt: ${attempt}/${maxAttempts}`)

      await delay(freq)
    }
  }

  const reason = lastError instanceof Error ? lastError.message : String(lastError)

  throw new Error(`Failed to detect path at ${dir} after ${maxAttempts} attempts. Last error: ${reason}`)
}

export async function waitUntilIconsBuilt (): Promise<void> {
  await waitUntilExists(path.join(__dirname, '..', 'packages', 'icons', 'dist', 'favicon'), { freq: 1000, maxAttempts: 12 })
}
