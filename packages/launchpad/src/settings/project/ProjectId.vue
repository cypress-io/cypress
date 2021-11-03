<template>
  <SettingsSection>
    <template #title>
      {{ t('settingsPage.projectId.title') }}
    </template>
    <template #description>
      <i18n-t keypath="settingsPage.projectId.description">
        <a
          href="https://docs.cypress.io"
        >{{ t('links.learnMore') }}</a>
      </i18n-t>
    </template>
    <div class="inline-grid grid-flow-col justify-start gap-10px">
      <ShikiHighlight
        :code="formattedProjectId"
        class="max-w-400px text-sm border border-gray-100 rounded overflow-hidden"
        :prefix-icon="IconCodeBraces"
        prefix-icon-class="text-cool-gray-400"
        lang="yaml"
        inline
      />
      <CopyButton
        v-if="props.gql?.projectId"
        :text="props.gql?.projectId"
        variant="outline"
      />
    </div>
  </SettingsSection>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { gql } from '@urql/core'
import IconCodeBraces from '~icons/mdi/code'
import { useI18n } from '@cy/i18n'
import ShikiHighlight from '@cy/components/ShikiHighlight.vue'
import CopyButton from '@cy/components/CopyButton.vue'
import type { ProjectIdFragment } from '../../generated/graphql'
import SettingsSection from '../SettingsSection.vue'

gql`
fragment ProjectId on Project {
  projectId
}
`

const props = defineProps<{
  mockClipboard?: any,
  gql?: ProjectIdFragment
}>()

const formattedProjectId = computed(() => `projectId: '${props.gql?.projectId}'`)

const { t } = useI18n()
</script>

<style lang="scss" scoped>
pre {
  @apply bg-transparent m-0 p-0;
}
</style>
