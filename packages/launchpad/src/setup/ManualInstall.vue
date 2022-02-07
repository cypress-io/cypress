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
        <i-cy-status-download-done_x24
          v-if="props.packagesInstalled.includes(dep.package)"
          class="h-24px my-12px ml-24px w-24px float-right"
          :aria-label="t('setupPage.install.installed')"
        />
        <i-cy-status-download-pending_x24
          v-else
          class="h-24px my-8px ml-24px w-24px float-right"
          :aria-label="t('setupPage.install.pendingInstall')"
        />
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
import { computed, ref } from 'vue'
import { gql } from '@urql/core'
import TerminalPrompt from '@cy/components/TerminalPrompt.vue'
import ExternalLink from '@cy/gql-components/ExternalLink.vue'
import type { ManualInstallFragment } from '../generated/graphql'
import { useI18n } from '@cy/i18n'

const { t } = useI18n()

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
  packagesInstalled: string[]
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
