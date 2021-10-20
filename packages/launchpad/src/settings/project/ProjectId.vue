<template>
  <SettingsSection>
    <template #title>
      {{ t('settingsPage.projectId.title') }}
    </template>
    <template #description>
      <i18n-t keypath="settingsPage.projectId.description">
        <a
          href="https://docs.cypress.io"
          target="_blank"
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
      <Button
        variant="outline"
        @click="clipboard.copy(gql?.projectId)"
      >
        <template #prefix>
          <Icon
            class="text-cool-gray-600"
            :icon="IconDashedSquare"
          />
        </template>
        {{ clipboard.copied.value ? t('clipboard.copied') : t('clipboard.copy') }}
      </Button>
    </div>
  </SettingsSection>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue'
import { gql } from '@urql/core'
import Icon from '@cy/components/Icon.vue'
import IconCodeBraces from '~icons/mdi/code-braces'
import IconDashedSquare from '~icons/si-glyph/square-dashed-2'
import Button from '@cy/components/Button.vue'
import SettingsSection from '../SettingsSection.vue'
import { useClipboard } from '@vueuse/core'
import { useI18n } from '@cy/i18n'
import type { ProjectIdFragment } from '../../generated/graphql'
import ShikiHighlight from '../../../../frontend-shared/src/components/ShikiHighlight.vue'

gql`
fragment ProjectId on Project {
  projectId
}
`

const props = defineProps<{
  mockClipboard?: any,
  gql?: ProjectIdFragment
}>()

const clipboard = props.mockClipboard?.() || useClipboard({ source: ref(props.gql?.projectId || '') })

const formattedProjectId = computed(() => `projectId: '${props.gql?.projectId}'`)

const { t } = useI18n()
</script>

<style lang="scss" scoped>
pre {
  @apply bg-transparent m-0 p-0;
}
</style>
