<template>
  <ProjectSettingsSection>
    <template #title>
      {{ t('settingsPage.recordKey.title') }}
    </template>
    <template #description>
      <i18n-t keypath="settingsPage.recordKey.description">
        <a
          href="https://docs.cypress.io"
          target="_blank"
        >{{ t('links.learnMore') }}</a>
      </i18n-t>
    </template>
    <div
      v-if="props.gql.key"
      class="inline-flex justify-start gap-10px"
    >
      <Input
        :value="props.gql.key"
        class="font-mono"
        input-classes="text-sm"
        disabled
        :type="showRecordKey ? 'text' : 'password'"
      >
        <template #prefix>
          <Icon
            :icon="IconKey"
            class="text-cool-gray-400"
          />
        </template>
        <template #suffix>
          <button
            aria-label="Record Key Visibility Toggle"
            class="text-cool-gray-400 hover:text-cool-gray-500"
            @click="showRecordKey = !showRecordKey"
          >
            <Icon
              v-if="showRecordKey"
              :icon="IconEyeOpen"
            />
            <Icon
              v-else
              :icon="IconEyeClosed"
            />
          </button>
        </template>
      </Input>
      <Button
        variant="outline"
        :prefix-icon="IconDashedSquare"
        prefix-icon-class="text-cool-gray-500"
        @click="clipboard.copy()"
      >
        {{ clipboard.copied.value ? t('clipboard.copied') : t('clipboard.copy') }}
      </Button>
      <Button
        variant="outline"
        :prefix-icon="IconKey"
        prefix-icon-class="text-cool-gray-500 w-1.2rem h-1.2rem"
        @click="openManageKeys"
      >
        {{ t('settingsPage.recordKey.manageKeys') }}
      </Button>
    </div>
  </ProjectSettingsSection>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { useClipboard } from '@vueuse/core'
import { useI18n } from '@cy/i18n'
import type { RecordKeyFragment } from '../../generated/graphql'
import ProjectSettingsSection from '../SettingsSection.vue'
import Icon from '@packages/frontend-shared/src/components/Icon.vue'
import Button from '@packages/frontend-shared/src/components/Button.vue'
import Input from '@packages/frontend-shared/src/components/Input.vue'
import IconKey from '~icons/foundation/key'
import IconEyeOpen from '~icons/mdi/eye-outline'
import IconEyeClosed from '~icons/mdi/eye-off-outline'
import IconDashedSquare from '~icons/si-glyph/square-dashed-2'
import { gql } from '@urql/core'

gql`
fragment RecordKey on CloudRecordKey {
  id
  key
}
`

const props = defineProps<{
  gql: RecordKeyFragment
}>()

const clipboard = useClipboard({ source: ref(props.gql.key ?? '') })
const openManageKeys = () => { }
const showRecordKey = ref(false)
const { t } = useI18n()
</script>
