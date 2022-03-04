import { Clipboard_CopyToClipboardDocument } from '../generated/graphql'
import { gql, useMutation } from '@urql/vue'
import { ref } from 'vue'

gql`
mutation Clipboard_CopyToClipboard($text: String!) {
  copyTextToClipboard(text: $text)
}
`

export function useClipboard () {
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
    }, 2000)
  }

  return { copy, copied, isSupported: true }
}
