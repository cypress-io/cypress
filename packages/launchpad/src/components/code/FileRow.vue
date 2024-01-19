<template>
  <Collapsible
    class="rounded bg-light-50 border-gray-100 mb-4 w-full block"
    max-height="500px"
    :initially-open="statusInfo.initiallyOpen"
    :data-cy="status"
    :file-row="true"
  >
    <template #target="{open}">
      <ListRowHeader
        :class="{ 'rounded-b-none mb-[0.1em] default-ring': open, 'overflow-hidden': !open }"
        class="border hocus-default cursor-pointer font-medium"
        :description="description"
        :icon="statusInfo.icon"
      >
        <template #header>
          <span class="inline-block align-top">{{ filePath }}</span>
          <Badge
            v-if="!open && statusInfo.badgeType"
            cy-data="changes-required-badge"
            :label="statusInfo.badgeLabel"
            :status="statusInfo.badgeType"
          />
        </template>
        <template #right>
          <i-cy-chevron-down
            :class="{ 'rotate-180': open }"
            class="max-w-[16px] transform icon-dark-gray-400"
          />
        </template>
      </ListRowHeader>
    </template>
    <div
      v-if="status === 'changes'"
      class="border-b flex bg-warning-100 border-b-gray-100 p-3 top-0 text-warning-600 z-1 sticky items-center"
    >
      <p class="grow text-left ml-1">
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
        size="32"
        @click="openLearnMoreExternalLink"
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
import type { FunctionalComponent, SVGAttributes, ComputedRef } from 'vue'
import type { BadgeRowStatus } from '@cy/components/Badge.vue'

export type FileRowStatus = 'changes' | 'valid' | 'skipped' | 'error';

export type StatusInfo = {
  badgeLabel?: string
  badgeType?: BadgeRowStatus
  icon: FunctionalComponent<SVGAttributes, {}>
  initiallyOpen?: boolean
}
</script>

<script lang="ts" setup>
import { computed } from 'vue'
import Button from '@cypress-design/vue-button'
import { useExternalLink } from '@cy/gql-components/useExternalLink'
import Badge from '@cy/components/Badge.vue'
import { useI18n } from '@cy/i18n'
import ShikiHighlight from '@cy/components/ShikiHighlight.vue'
import ListRowHeader from '@cy/components/ListRowHeader.vue'
import Collapsible from '@cy/components/Collapsible.vue'
import AddedIcon from '~icons/cy/file-changes-added_x24.svg'
import SkippedIcon from '~icons/cy/file-changes-skipped_x24.svg'
import ErrorIcon from '~icons/cy/file-changes-error_x24.svg'
import WarningIcon from '~icons/cy/file-changes-warning_x24.svg'

const LEARN_MORE_URL = 'https://on.cypress.io/guides/configuration'

const { t } = useI18n()

const props = defineProps<{
  status: FileRowStatus
  filePath: string
  content: string
  description?: string
  fileExtension: string
}>()

const openLearnMoreExternalLink = useExternalLink(LEARN_MORE_URL)

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
      initiallyOpen: false,
    },
    error: {
      icon: ErrorIcon,
      initiallyOpen: true,
    },
  }

  return info[props.status]
})
</script>
