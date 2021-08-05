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
        class="text-sm"
        :prefixIcon="IconCodeBraces"
        prefixIconClass="text-cool-gray-400"
        readonly
        v-model="formattedProjectId"
      ></InlineCodeEditor>
      <Button variant="outline" @click="clipboard.copy(projectId)">
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
import "prismjs"
import "@packages/reporter/src/errors/prism.scss"
import IconCodeBraces from 'virtual:vite-icons/mdi/code-braces'
import IconDashedSquare from 'virtual:vite-icons/si-glyph/square-dashed-2'
import Button from '../../components/button/Button.vue'
import SettingsSection from '../SettingsSection.vue'
import { useClipboard } from '@vueuse/core'
import InlineCodeEditor from '../../components/code/InlineCodeEditor.vue'
import { useI18n } from '../../composables'

const props = defineProps<{
  mockClipboard?: any
}>()

const projectId = ref('74e08848-f0f6-11eb-9a03-0242ac130003')
// for testing - copy requires browser permissions and fails in chrome on CI otherwise.
const clipboard = props.mockClipboard?.() || useClipboard({ source: projectId })

const formattedProjectId = computed(() => `projectId: '${projectId.value}'`)

onMounted(() => import("prismjs/components/prism-yaml"))
const { t } = useI18n()
</script>

<style lang="scss" scoped>
pre {
  @apply bg-transparent m-0 p-0;
}
</style>
