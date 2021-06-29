/* this implementation is original ported from https://github.com/logaretm/vue-use-web by Abdelrahman Awad */

import { ref, Ref, shallowRef } from 'vue'
import { tryOnUnmounted } from '../../shared'
import { ConfigurableWindow, defaultWindow } from '../_configurable'

/**
 * Simple Web Workers registration and communication.
 *
 * @see https://vueuse.org/useWebWorker
 * @param url
 * @param workerOptions
 * @param options
 */
export function useWebWorker(
  url: string,
  workerOptions?: WorkerOptions,
  options: ConfigurableWindow = {},
) {
  const {
    window = defaultWindow,
  } = options

  const data: Ref<any> = ref(null)
  const worker = shallowRef<Worker>()

  const post: typeof Worker.prototype['postMessage'] = function post(val: any) {
    if (!worker.value)
      return

    worker.value.postMessage(val)
  }

  const terminate: typeof Worker.prototype['terminate'] = function terminate() {
    if (!worker.value)
      return

    worker.value.terminate()
  }

  if (window) {
    // @ts-expect-error untyped
    worker.value = new window.Worker(url, workerOptions)

    worker.value!.onmessage = (e: MessageEvent) => {
      data.value = e.data
    }

    tryOnUnmounted(() => {
      if (worker.value)
        worker.value.terminate()
    })
  }

  return {
    data,
    post,
    terminate,
    worker,
  }
}

export type UseWebWorkerReturn = ReturnType<typeof useWebWorker>
