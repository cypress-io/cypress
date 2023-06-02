<template>
  <div
    v-if="props.gql.wizard.installDependenciesCommand"
  >
    <p
      class="pt-[24px] pr-[24px] pl-[24px] mb-[-12px] text-gray-800 font-500 text-[16px]"
    >
      {{ t('setupWizard.installDependencies.pasteCommand') }}
    </p>
    <TerminalPrompt
      class="m-[24px]"
      :command="props.gql.wizard.installDependenciesCommand"
      :project-folder-name="projectFolder"
    />
  </div>
  <div
    class="px-[24px]"
    :class="{ 'border-t border-t-gray-100': !!props.gql.wizard.installDependenciesCommand }"
  >
    <ul data-cy="dependencies-to-install">
      <li
        v-for="dep in props.gql.wizard.packagesToInstall"
        :key="dep.package"
        class="border-b border-b-gray-100 py-[16px] last-of-type:border-b-0"
        :data-cy="`dependency-${dep.package}`"
      >
        <i-cy-status-download-done_x24
          v-if="dep.satisfied"
          class="h-[24px] my-[12px] ml-[24px] w-[24px] float-right"
          :aria-label="t('setupWizard.installDependencies.installed')"
        />
        <i-cy-status-download-pending_x24
          v-else
          class="h-[24px] my-[8px] ml-[24px] w-[24px] float-right"
          :aria-label="t('setupWizard.installDependencies.pendingInstall')"
        />
        <span class="text-[14px] ">
          <ExternalLink
            :href="`https://www.npmjs.com/package/${dep.package}`"
            class="text-indigo-500 hocus-link-default"
          >
            {{ dep.package }}
          </ExternalLink>
          <span class="border rounded-md font-semibold border-gray-100 text-xs ml-[6px] text-gray-700">
            <span class="p-[4px]">{{ dep.minVersion }}</span>
            <span
              v-if="!dep.satisfied && dep.detectedVersion"
              class="border-l font-medium bg-gray-50 border-gray-100 px-[4px] text-gray-600"
            >
              detected {{ dep.detectedVersion }}
            </span>
          </span>
        </span>
        <p
          class="text-gray-500 text-[14px] leading-5"
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
      minVersion
      detectedVersion
      satisfied
    }
    installDependenciesCommand
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
</script>
