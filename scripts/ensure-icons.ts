import fs from 'node:fs/promises'
import path from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'

interface WaitOptions {
  freq: number
  maxAttempts: number
}

async function pathExists (dir: string): Promise<boolean> {
  try {
    await fs.access(dir)

    return true
  } catch (err) {
    // Only a missing path means the build isn't done; anything else (EACCES, ENOTDIR) won't fix itself by waiting
    if (err instanceof Error && 'code' in err && err.code === 'ENOENT') {
      return false
    }

    throw err
  }
}

export async function waitUntilExists (dir: string, { freq, maxAttempts }: WaitOptions): Promise<void> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    if (await pathExists(dir)) {
      return
    }

    if (attempt < maxAttempts) {
      console.log(`[scripts/ensure-icons]: ${dir} not found. Will check again in ${freq}ms. Attempt: ${attempt}/${maxAttempts}`)

      await delay(freq)
    }
  }

  throw new Error(`Failed to detect path at ${dir} after ${maxAttempts} attempts.`)
}

export async function waitUntilIconsBuilt (): Promise<void> {
  await waitUntilExists(path.join(__dirname, '..', 'packages', 'icons', 'dist', 'favicon'), { freq: 1000, maxAttempts: 10 })
}
