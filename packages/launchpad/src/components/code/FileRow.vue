<template>
  <Collapsible
    class="border rounded bg-light-50 border-gray-100 mb-4 w-full block
  overflow-hidden hocus-default"
    max-height="500px"
    :initially-open="statusInfo.initiallyOpen"
    :data-cy="status"
  >
    <template #target="{open}">
      <ListRowHeader
        :class="{ 'border-b border-b-gray-100 rounded-b-none': open }"
        class="cursor-pointer font-medium"
        :description="description"
        :icon="statusInfo.icon"
      >
        <template #header>
          <span class="inline-block align-top">{{ filePath }}</span>
          <Badge
            v-if="!open && statusInfo.badgeType"
            :label="statusInfo.badgeLabel"
            :status="statusInfo.badgeType"
          />
        </template>
        <template #right>
          <i-cy-chevron-down
            :class="{ 'rotate-180': open }"
            class="max-w-16px transform icon-dark-gray-400"
          />
        </template>
      </ListRowHeader>
    </template>
    <div
      v-if="status === 'changes'"
      class="border-b flex bg-warning-100 border-b-gray-100 p-3 top-0 text-warning-600 z-1 sticky items-center"
    >
      <p class="flex-grow text-left ml-1">
        <span class="font-semibold">{{ t('setupPage.configFile.changesRequiredLabel') }}: </span>
        <i18n-t
          scope="global"
          keypath="setupPage.configFile.changesRequiredDescription"
        >
          <span class="rounded bg-warning-200 px-1 text-warning-600 inline-block">{{ filePath }}</span>
        </i18n-t>
      </p>
      <Button
        class="whitespace-nowrap"
        href="https://on.cypress.io/guides/configuration"
      >
        {{ t('links.learnMoreButton') }}
      </Button>
    </div>
    <ShikiHighlight
      :lang="language"
      :code="content"
      line-numbers
      copy-on-click
    />
  </Collapsible>
</template>

<script lang="ts">
import type { BadgeRowStatus } from '@cy/components/Badge.vue'
import type { FunctionalComponent, SVGAttributes, ComputedRef } from 'vue'

export type FileRowStatus = 'changes' | 'valid' | 'skipped' | 'error';

export type StatusInfo = {
  badgeLabel?: string
  badgeType?: BadgeRowStatus
  icon: FunctionalComponent<SVGAttributes, {}>
  initiallyOpen?: boolean
}
</script>

<script lang="ts" setup>
// eslint-disable-next-line no-duplicate-imports
import { computed } from 'vue'
import Button from '@cy/components/Button.vue'
// eslint-disable-next-line no-duplicate-imports
import Badge from '@cy/components/Badge.vue'
import { useI18n } from '@cy/i18n'
import ShikiHighlight from '@cy/components/ShikiHighlight.vue'
import ListRowHeader from '@cy/components/ListRowHeader.vue'
import Collapsible from '@cy/components/Collapsible.vue'
import AddedIcon from '~icons/cy/file-changes-added_x24.svg'
import SkippedIcon from '~icons/cy/file-changes-skipped_x24.svg'
import ErrorIcon from '~icons/cy/file-changes-error_x24.svg'
import WarningIcon from '~icons/cy/file-changes-warning_x24.svg'

const { t } = useI18n()

const props = defineProps<{
  status: FileRowStatus
  filePath: string
  content: string
  description?: string
  fileExtension: string
}>()

const language = computed(() => {
  // The fileExtension from FileParts is prepended with a period;
  // we must strip the period to validate against our supported languages.
  return props.fileExtension.replace(/^\./, '')
})

const statusInfo: ComputedRef<StatusInfo> = computed(() => {
  const info: Record<FileRowStatus, StatusInfo> = {
    changes: {
      badgeLabel: t('setupPage.configFile.changesRequiredBadge'),
      badgeType: 'warning',
      icon: WarningIcon,
      initiallyOpen: true,
    },
    skipped: {
      badgeLabel: t('setupPage.configFile.skippedLabel'),
      badgeType: 'skipped',
      icon: SkippedIcon,
      initiallyOpen: false,
    },
    valid: {
      icon: AddedIcon,
      initiallyOpen: true,
    },
    error: {
      icon: ErrorIcon,
    },
  }

  return info[props.status]
})
</script>
