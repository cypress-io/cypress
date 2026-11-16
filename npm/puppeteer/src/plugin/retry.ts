import { pluginError } from './util'

function delay (time: number) {
  return new Promise<void>((resolve) => {
    setTimeout(() => resolve(), time)
  })
}

export async function retry<T> (functionToRetry: () => T, options?: { timeout?: number, delayBetweenTries?: number }): Promise<T> {
  const timeout = options?.timeout !== undefined ? options?.timeout : 4000
  const delayBetweenTries = options?.delayBetweenTries !== undefined ? options?.delayBetweenTries : 200

  const startTime = Date.now()

  const makeAttempt = async (): Promise<T> => {
    try {
      return await functionToRetry()
    } catch (err: any) {
      if (Date.now() - startTime >= timeout) {
        throw pluginError(`Failed retrying after ${timeout}ms: ${err.message}`)
      }

      await delay(delayBetweenTries)

      return makeAttempt()
    }
  }

  return makeAttempt()
}
