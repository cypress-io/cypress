<template>
  <TerminalPrompt
    class="m-24px"
    :command="installDependenciesCode"
    :project-folder-name="projectFolder"
  />
  <div class="border-t border-t-gray-100 px-24px">
    <ul>
      <li
        v-for="dep in wizardStore.toInstall"
        :key="dep.package"
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
import ExternalLink from '@packages/frontend-shared/src/gql-components/ExternalLink.vue'
import { useWizardStore } from '../store/wizardStore'
import { gql } from '@urql/core'
import type { ManualInstallFragment } from '../generated/graphql'

gql`
fragment ManualInstall on Query {
  currentProject {
    id
    title
  }
}
`

const props = defineProps<{
  gql: ManualInstallFragment
}>()

const projectFolder = computed(() => props.gql.currentProject?.title ?? '')

const wizardStore = useWizardStore()

const installDependenciesCode = computed(
  () => {
    return `yarn add -D ${
    (wizardStore.toInstall ?? [])
    .map((pack) => `${pack.package}`)
    .join(' ')}`
  },
)
</script>
