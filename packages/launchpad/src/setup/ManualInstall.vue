<template>
  <TerminalPrompt
    :command="installDependenciesCode"
    :project-folder-name="props.gql.title || ''"
  />
  <div class="border-t border-t-gray-100 px-24px">
    <ul>
      <li
        v-for="dep in props.gql.packagesToInstall"
        :key="dep.id"
        class="py-16px border-b border-b-gray-100 last-of-type:border-b-0"
      >
        <a
          :href="`https://www.npmjs.com/package/${dep.package}`"
          target="_blank"
          class="text-indigo-500 text-14px hocus-link-default"
        >{{ dep.package }}</a>
        <p
          class="text-gray-500 text-14px leading-5"
          v-html="dep.description"
        />
      </li>
    </ul>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import CopyButton from '@cy/components/CopyButton.vue'
import TerminalPrompt from '@cy/components/TerminalPrompt.vue'
import { gql } from '@urql/core'
import type { ManualInstallFragment } from '../generated/graphql'

gql`
fragment ManualInstall on Wizard {
  title
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

const installDependenciesCode = computed(
  () => {
    return `yarn add -D ${
    (props.gql.packagesToInstall ?? [])
    .map((pack) => `${pack.package}`)
    .join(' ')}`
  },
)
</script>
