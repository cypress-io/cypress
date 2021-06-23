import { isString, MaybeRef } from '../../shared'
import { ref, watch } from 'vue'
import { ConfigurableDocument, defaultDocument } from '../_configurable'
import { useMutationObserver } from '../useMutationObserver'

export interface UseTitleOptions extends ConfigurableDocument {
  /**
   * Observe `document.title` changes using MutationObserve
   *
   * @default false
   */
  observe?: boolean
}

/**
 * Reactive document title.
 *
 * @see https://vueuse.org/useTitle
 * @param newTitle
 * @param options
 */
export function useTitle(
  newTitle: MaybeRef<string | null | undefined> = null,
  options: UseTitleOptions = {},
) {
  const {
    document = defaultDocument,
    observe = false,
  } = options

  let titleValue = null
  if (document && document.title) {
    titleValue = document.title
  }
  if (newTitle) {
    titleValue = newTitle
  }

  const title = ref(titleValue)

  watch(
    title,
    (t, o) => {
      if (isString(t) && t !== o && document)
        document.title = t
    },
    { immediate: true },
  )

  if (observe && document) {
    useMutationObserver(
      document.head && document.headquerySelector('title'),
      () => {
        if (document && document.title !== title.value)
          title.value = document.title
      },
      { childList: true },
    )
  }

  return title
}
