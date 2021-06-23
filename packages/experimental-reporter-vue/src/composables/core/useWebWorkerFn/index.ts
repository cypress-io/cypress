/* this implementation is a vue port of https://github.com/alewin/useWorker by Alessio Koci */

import { ref } from 'vue'
import createWorkerBlobUrl from './lib/createWorkerBlobUrl'
import { tryOnUnmounted } from '../../shared'
import { ConfigurableWindow, defaultWindow } from '../_configurable'

export type WebWorkerStatus =
  | 'PENDING'
  | 'SUCCESS'
  | 'RUNNING'
  | 'ERROR'
  | 'TIMEOUT_EXPIRED'

export interface WebWorkerOptions extends ConfigurableWindow {
  /**
   * Number of milliseconds before killing the worker
   *
   * @default undefined
   */
  timeout?: number
  /**
   * An array that contains the external dependencies needed to run the worker
   */
  dependencies?: string[]
}

/**
 * Run expensive function without blocking the UI, using a simple syntax that makes use of Promise.
 *
 * @see https://vueuse.org/useWebWorkerFn
 * @param fn
 * @param options
 */
export const useWebWorkerFn = <T extends (...fnArgs: any[]) => any>(
  fn: T,
  options: WebWorkerOptions = {},
) => {
  const {
    dependencies = [],
    timeout,
    window = defaultWindow,
  } = options

  const worker = ref<(Worker & { _url?: string }) | undefined>()
  const workerStatus = ref<WebWorkerStatus>('PENDING')
  const promise = ref<({ reject?: (result: ReturnType<T> | ErrorEvent) => void;resolve?: (result: ReturnType<T>) => void })>({})
  const timeoutId = ref<number>()

  const workerTerminate = (status: WebWorkerStatus = 'PENDING') => {
    if (worker.value && worker.value._url && window) {
      worker.value.terminate()
      URL.revokeObjectURL(worker.value._url)
      promise.value = {}
      worker.value = undefined
      window.clearTimeout(timeoutId.value)
      workerStatus.value = status
    }
  }

  workerTerminate()

  tryOnUnmounted(workerTerminate)

  const generateWorker = () => {
    const blobUrl = createWorkerBlobUrl(fn, dependencies)
    const newWorker: Worker & { _url?: string } = new Worker(blobUrl)
    newWorker._url = blobUrl

    newWorker.onmessage = (e: MessageEvent) => {
      const { resolve = () => {}, reject = () => {} } = promise.value
      const [status, result] = e.data as [WebWorkerStatus, ReturnType<T>]

      switch (status) {
        case 'SUCCESS':
          resolve(result)
          workerTerminate(status)
          break
        default:
          reject(result)
          workerTerminate('ERROR')
          break
      }
    }

    newWorker.onerror = (e: ErrorEvent) => {
      const { reject = () => {} } = promise.value

      reject(e)
      workerTerminate('ERROR')
    }

    if (timeout) {
      timeoutId.value = setTimeout(
        () => workerTerminate('TIMEOUT_EXPIRED'),
        timeout,
      ) as any
    }
    return newWorker
  }

  const callWorker = (...fnArgs: Parameters<T>) =>
    new Promise<ReturnType<T>>((resolve, reject) => {
      promise.value = {
        resolve,
        reject,
      }
      worker.value && worker.value.postMessage([[...fnArgs]])

      workerStatus.value = 'RUNNING'
    })

  const workerFn = (...fnArgs: Parameters<T>) => {
    if (workerStatus.value === 'RUNNING') {
      /* eslint-disable-next-line no-console */
      console.error(
        '[useWebWorkerFn] You can only run one instance of the worker at a time.',
      )
      /* eslint-disable-next-line prefer-promise-reject-errors */
      return Promise.reject()
    }

    worker.value = generateWorker()
    return callWorker(...fnArgs)
  }

  return {
    workerFn,
    workerStatus,
    workerTerminate,
  }
}

export type UseWebWorkerFnReturn = ReturnType<typeof useWebWorkerFn>
