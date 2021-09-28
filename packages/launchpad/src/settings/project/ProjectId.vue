<template>
  <SettingsSection>
    <template #title>{{ t('settingsPage.projectId.title') }}</template>
    <template #description>
      <i18n-t keypath="settingsPage.projectId.description">
        <a href="https://docs.cypress.io" target="_blank">{{ t('links.learnMore') }}</a>
      </i18n-t>
    </template>
    <div class="inline-grid grid-flow-col justify-start gap-10px">
      <InlineCodeEditor
        class="max-w-400px"
        :prefixIcon="IconCodeBraces"
        prefixIconClass="text-cool-gray-400"
        readonly
        v-model="formattedProjectId"
      ></InlineCodeEditor>
      <Button variant="outline" @click="clipboard.copy(gql?.projectId)">
        <template #prefix>
          <Icon class="text-cool-gray-600" :icon="IconDashedSquare" />
        </template>
        {{ clipboard.copied.value ? t('clipboard.copied') : t('clipboard.copy') }}
      </Button>
    </div>
  </SettingsSection>
</template>

<script lang="ts" setup>
import { ref, onMounted, computed } from 'vue'
import { gql } from '@urql/core'
import "prismjs"
import "@packages/reporter/src/errors/prism.scss"
import Icon from '@cy/components/Icon.vue'
import IconCodeBraces from '~icons/mdi/code-braces'
import IconDashedSquare from '~icons/si-glyph/square-dashed-2'
import Button from '@cy/components/Button.vue'
import SettingsSection from '../SettingsSection.vue'
import { useClipboard } from '@vueuse/core'
import InlineCodeEditor from '../../components/code/InlineCodeEditor.vue'
import { useI18n } from '@cy/i18n'
import type { ProjectIdFragment } from '../../generated/graphql'

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

onMounted(() => import("prismjs/components/prism-yaml"))
const { t } = useI18n()
</script>

<style lang="scss" scoped>
pre {
  @apply bg-transparent m-0 p-0;
}
</style>
