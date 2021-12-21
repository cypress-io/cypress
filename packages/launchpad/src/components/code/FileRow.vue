<template>
  <Collapsible
    class="block w-full mb-4 overflow-hidden border border-gray-100 rounded
  bg-light-50 hocus-default"
    max-height="500px"
    :initially-open="statusInfo.initiallyOpen"
  >
    <template #target="{open}">
      <ListRowHeader
        :class="{ 'border-b border-b-gray-100 rounded-b-none': open }"
        class="cursor-pointer"
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
            class="transform max-w-16px icon-dark-gray-400"
          />
        </template>
      </ListRowHeader>
    </template>
    <div
      v-if="status === 'changes'"
      class="flex sticky top-0 z-1 border-b-gray-100 border-b items-center p-3 bg-warning-100 text-warning-600"
    >
      <p class="flex-grow ml-1 text-left">
        <span class="font-semibold">{{ t('setupPage.configFile.changesRequiredLabel') }}: </span>
        <i18n-t
          scope="global"
          keypath="setupPage.configFile.changesRequiredDescription"
        >
          <span class="inline-block px-1 rounded bg-warning-200 text-warning-600">{{ filePath }}</span>
        </i18n-t>
      </p>
      <Button
        class="whitespace-nowrap"
        @click="openDocs"
      >
        {{ t('links.learnMore') }}
      </Button>
    </div>
    <ShikiHighlight
      :lang="language"
      :code="content"
      line-numbers
      copy-on-click
      copy-button
    />
  </Collapsible>
</template>

<script lang="ts">
import type { BadgeRowStatus } from '@cy/components/Badge.vue'
import type { FunctionalComponent, SVGAttributes, ComputedRef } from 'vue'

export type FileRowStatus = 'changes' | 'valid' | 'skipped' | 'error';

export type StatusInfo = {
  badgeLabel?: string,
  badgeType?: BadgeRowStatus,
  icon: FunctionalComponent<SVGAttributes, {}>,
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
import ShikiHighlight, { CyLangType, langsSupported } from '@cy/components/ShikiHighlight.vue'
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
}>()

const openDocs = () => window.open('https://on.cypress.io/guides/configuration')

// TODO: Remove this. Use FileParts when available
const language = computed(() => {
  // get the extension of the current file path
  const extension = /\.(\w+)$/.exec(props.filePath)?.[1]

  if (extension && (langsSupported as readonly string[]).includes(extension)) {
    return extension as CyLangType
  }

  return 'plaintext'
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
      initiallyOpen: true,
    },
    valid: {
      icon: AddedIcon,
    },
    error: {
      icon: ErrorIcon,
    },
  }

  return info[props.status]
})
</script>
