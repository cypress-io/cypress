<template>
  <TerminalPrompt
    class="m-24px"
    :command="installDependenciesCode"
    :project-folder-name="projectFolder"
  />
  <div class="border-t border-t-gray-100 px-24px">
    <ul>
      <li
        v-for="dep in props.gql.wizard.packagesToInstall"
        :key="dep.id"
        class="border-b border-b-gray-100 py-16px last-of-type:border-b-0"
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
    packageManager
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

const commands = {
  'npm': 'npm install -D ',
  'pnpm': 'pnpm install -D ',
  'yarn': 'yarn add -D ',
}

const installDependenciesCode = computed(
  () => {
    return commands[props.gql.currentProject?.packageManager ?? 'npm'] +
    (props.gql.wizard.packagesToInstall ?? [])
    .map((pack) => `${pack.package}`)
    .join(' ')
  },
)
</script>
