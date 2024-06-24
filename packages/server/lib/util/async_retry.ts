type RetryOptions<TErr extends any> = {
  maxAttempts: number
  retryDelay?: (attempt: number) => number
  shouldRetry?: (err?: TErr) => boolean
}

export function asyncRetry <TArgs extends any[], TResult extends any, TErr extends any> (fn: (...args: TArgs) => Promise<TResult>, options: RetryOptions<TErr>) {
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

    throw new AggregateError(errors)
  }
}
