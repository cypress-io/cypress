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
          <a
            class="rounded cursor-pointer bg-warning-200 px-1 text-warning-600 inline-block"
            @click="openFile"
          >
            {{ filePath }}
          </a>
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
import { gql, useMutation } from '@urql/vue'
import { useExternalLink } from '@cy/gql-components/useExternalLink'
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
import { OpenFileInIdeDocument } from '@packages/data-context/src/gen/all-operations.gen'

const { t } = useI18n()

const props = defineProps<{
  status: FileRowStatus
  filePath: string
  content: string
  description?: string
}>()

const openDocs = useExternalLink('https://on.cypress.io/guides/configuration')

gql`
mutation OpenFileInIDE ($input: FileDetailsInput!) {
  openFileInIDE (input: $input)
}
`

const openFileInIDE = useMutation(OpenFileInIdeDocument)

function openFile () {
  openFileInIDE.executeMutation({
    input: {
      absolute: props.filePath,
      line: 0,
      column: 0,
    },
  })
}

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
