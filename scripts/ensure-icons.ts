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
  } catch {
    return false
  }
}

async function waitUntilExists (dir: string, { freq, maxAttempts }: WaitOptions, numAttempts = 0): Promise<true> {
  if (await pathExists(dir)) {
    return true
  }

  if (numAttempts > maxAttempts) {
    throw Error(`Failed to detect path at ${dir} after ${maxAttempts}.`)
  }

  console.log(`[@packages/runner/webpack.config.ts]: ${dir} not found. Will check again in ${freq}ms. Attempt: ${numAttempts}/${maxAttempts}`)

  await delay(freq)

  return waitUntilExists(dir, { freq, maxAttempts }, numAttempts + 1)
}

export async function waitUntilIconsBuilt (): Promise<void> {
  await waitUntilExists(path.join(__dirname, '..', 'packages', 'icons', 'dist', 'favicon'), { freq: 1000, maxAttempts: 10 })
}
