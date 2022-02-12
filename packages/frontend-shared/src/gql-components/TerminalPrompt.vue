<template>
  <code class="relative text-gray-700 font-light border border-gray-100 flex items-center leading-40px px-16px rounded whitespace-nowrap overflow-hidden">
    <i-cy-terminal_x16 class="w-16px h-16px icon-dark-gray-500 icon-light-gray-100 mr-8px flex-shrink-0" />
    <span class="text-purple-500 mr-8px">
      {{ projectFolderName }}<template v-if="projectFolderName">:~</template>$
    </span>
    {{ command }}
    <div class="font-sans absolute top-0 right-0 bottom-0 opacity-gradient p-4px pl-32px">
      <CopyButton
        :text="command"
        :copy-fn="onCopy"
      />
    </div>
  </code>
</template>

<script lang="ts" setup>
import CopyButton from '../components/CopyButton.vue'
import { gql, useMutation } from '@urql/vue'
import { TerminalPrompt_CopyTextDocument } from '../generated/graphql'

gql`
mutation TerminalPrompt_copyText($text: String!) {
  copyText(text: $text)
}
`

defineProps<{
  projectFolderName: string,
  command: string
}>()

const onCopyMutation = useMutation(TerminalPrompt_CopyTextDocument)
const onCopy = (text: string) => {
  onCopyMutation.executeMutation({ text })
}

</script>

<style lang="scss" scoped>
.opacity-gradient {
  background: linear-gradient(to right, rgba(255,255,255,.3) 0%, rgba(255,255,255, 1) 25%, rgba(255,255,255,1) 100%);
}
</style>
