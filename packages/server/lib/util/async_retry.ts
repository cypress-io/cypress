type RetryOptions = {
  maxAttempts: number
  retryDelay?: (attempt: number) => number
  shouldRetry?: (err?: Error) => boolean
}

export function asyncRetry <
  TArgs extends any[],
  TResult extends any,
> (fn: (...args: TArgs) => Promise<TResult>, options: RetryOptions) {
  return async (...args: TArgs): Promise<TResult> => {
    let attempt = 0
    let errors: Error[] = []

    const shouldRetry = options.shouldRetry ?? (() => true)

    do {
      try {
        return await fn(...args)
      } catch (e) {
        attempt++
        errors.push(e as Error)

        if (!shouldRetry(e)) {
          if (errors.length === 1) {
            throw e
          }

          throw new AggregateError(errors)
        }

        const delay = options.retryDelay ? options.retryDelay(attempt) : undefined

        if (delay !== undefined) {
          await new Promise((resolve) => {
            return setTimeout(resolve, delay)
          })
        }
      }
    } while (attempt < options.maxAttempts)

    if (errors.length === 1) {
      throw errors[0]
    }

    throw new AggregateError(errors)
  }
}

export const linearDelay = (inc: number) => {
  return (attempt: number) => {
    return attempt * inc
  }
}
