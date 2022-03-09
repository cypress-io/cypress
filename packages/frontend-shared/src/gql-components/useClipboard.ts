/**
 * Using the clipboard API from electron instead of the browser's navigator API,
 * we avoid the safety measures from the browser.
 * This way, regardless of the browser, we can use and test the clipboard.
 */
import { Clipboard_CopyToClipboardDocument } from '../generated/graphql'
import { gql, useMutation } from '@urql/vue'
import { ref } from 'vue'

gql`
mutation Clipboard_CopyToClipboard($text: String!) {
  copyTextToClipboard(text: $text)
}
`

interface ClipboardOptions {
  // time it takes in MS for the copied message to disappear
  copiedDuring?: number
}

export function useClipboard (options: ClipboardOptions = {}) {
  const copyMutation = useMutation(Clipboard_CopyToClipboardDocument)
  const copied = ref(false)

  let timer: NodeJS.Timeout | undefined

  const copy = async (text: string) => {
    const { data } = await copyMutation.executeMutation({ text })

    copied.value = data?.copyTextToClipboard ?? false
    if (timer) {
      clearTimeout(timer)
    }

    timer = setTimeout(() => {
      copied.value = false
      timer = undefined
    }, options.copiedDuring || 2000)
  }

  return { copy, copied }
}
