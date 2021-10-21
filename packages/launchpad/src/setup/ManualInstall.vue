<template>
  <div
    class="flex items-center gap-2 px-5 border-b border-gray-100  bg-gray-50 h-9 rounded-t-md"
  >
    <div
      v-for="i in [0, 1, 2]"
      :key="i"
      class="w-3 h-3 border rounded-md border-1-gray-600"
    />
  </div>
  <div class="relative">
    <pre class="p-5 text-left text-gray-500"><span
    class="text-purple-500"
    >{{ projectTitle }}:~$</span> {{ dependenciesCode }}</pre>
    <CopyButton :text="dependenciesCode" />
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import CopyButton from '@cy/components/CopyButton.vue'
import { gql } from '@urql/core'
import type { ManualInstallFragment } from '../generated/graphql'

gql`
fragment ManualInstall on Wizard {
  packagesToInstall {
    id
    name
    description
    package
  }
}
`

const props = defineProps<{
  gql: ManualInstallFragment
}>()

defineEmits<{(event: 'back'): void
}>()

const dependenciesCode = computed(
  () => {
    return `yarn add -D \\\n${
    (props.gql.packagesToInstall ?? [])
    .map((pack) => `                    ${pack.package} \\`)
    .join('\n')}`
  },
)
const projectTitle = 'TODO: project title in gql'
</script>
