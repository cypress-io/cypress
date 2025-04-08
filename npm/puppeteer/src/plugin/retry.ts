import { pluginError } from './util'

function delay (time: number) {
  return new Promise<void>((resolve) => {
    setTimeout(() => resolve(), time)
  })
}

export async function retry<T> (functionToRetry: () => T, options?: { timeout?: number, delayBetweenTries?: number }): Promise<T> {
  const timeout = options?.timeout !== undefined ? options?.timeout : 4000
  const delayBetweenTries = options?.delayBetweenTries !== undefined ? options?.delayBetweenTries : 200

  const makeAttempt = async (timeElapsed = 0): Promise<T> => {
    try {
      return await functionToRetry()
    } catch (err: any) {
      await delay(delayBetweenTries)

      if (timeElapsed >= timeout) {
        throw pluginError(`Failed retrying after ${timeout}ms: ${err.message}`)
      }

      return makeAttempt(timeElapsed + delayBetweenTries)
    }
  }

  return makeAttempt()
}
