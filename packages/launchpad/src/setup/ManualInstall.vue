<template>
  <TerminalPrompt
    :command="installDependenciesCode"
    :project-folder-name="projectFolder"
  />
  <div class="border-t border-t-gray-100 px-24px">
    <ul>
      <li
        v-for="dep in props.gql.wizard.packagesToInstall"
        :key="dep.id"
        class="py-16px border-b border-b-gray-100 last-of-type:border-b-0"
      >
        <ExternalLink
          :href="`https://www.npmjs.com/package/${dep.package}`"
          class="text-indigo-500 text-14px hocus-link-default"
        >
          {{ dep.package }}
        </ExternalLink>
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
import { gql } from '@urql/core'
import TerminalPrompt from '@cy/components/TerminalPrompt.vue'
import type { ManualInstallFragment } from '../generated/graphql'
import ExternalLink from '@packages/frontend-shared/src/gql-components/ExternalLink.vue'

gql`
fragment ManualInstall on Query {
  wizard {  
    packagesToInstall {
      id
      name
      description
      package
    }
  }
  currentProject {
    id
    title
  }
}
`

const projectFolder = computed(() => props.gql.currentProject?.title ?? '')

const props = defineProps<{
  gql: ManualInstallFragment
}>()

defineEmits<{
  (event: 'back'): void
}>()

const installDependenciesCode = computed(
  () => {
    return `yarn add -D ${
    (props.gql.wizard.packagesToInstall ?? [])
    .map((pack) => `${pack.package}`)
    .join(' ')}`
  },
)
</script>
