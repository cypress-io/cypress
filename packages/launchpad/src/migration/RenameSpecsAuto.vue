<template>
  <div class="text-[16px] leading-[24px]">
    <MigrationTitle :title="t('migration.renameAuto.title')" />
    <MigrationList>
      <MigrationListItem>
        {{ t('migration.renameAuto.changedSpecFolder') }}
        <CodeTag
          class="text-red-500"
        >
          cypress/integration
        </CodeTag>
        <i-cy-arrow-right_x16 class="h-[16px] w-[16px] inline-block icon-dark-gray-300" />
        <CodeTag
          class="text-jade-500"
        >
          cypress/e2e
        </CodeTag>
      </MigrationListItem>
      <MigrationListItem v-if="props.gql.shouldMigratePreExtension">
        <template
          v-if="selectOption === 'skip'"
        >
          {{ t('migration.renameAuto.optedOutMessage') }}
        </template>
        <template
          v-else-if="selectOption === 'renameFolder'"
        >
          {{ t('migration.renameAuto.folderRenameMessage') }}
        </template>
        <template
          v-else
        >
          {{ t('migration.renameAuto.changedSpecExt') }}
          <CodeTag
            class="text-red-500"
          >
            [filename].spec.[ext]
          </CodeTag>
          <i-cy-arrow-right_x16 class="h-[16px] w-[16px] inline-block icon-dark-gray-300" />
          <CodeTag
            class="text-jade-500"
          >
            [filename].cy.[ext]
          </CodeTag>
        </template>
        <span class="m-[8px] text-gray-100">——</span>
        <a
          class="cursor-pointer text-indigo-500 hover:underline"
          @click="showOptOutModal = true"
        >
          {{ t('migration.renameAuto.changeButton') }}
        </a>
      </MigrationListItem>
      <MigrationListItem v-if="!selectOption && props.gql.shouldMigratePreExtension">
        <i18n-t
          scope="global"
          keypath="migration.renameAuto.changedSpecPatternExplain"
        >
          <CodeTag class="text-jade-500">
            [filename].cy.[ext]
          </CodeTag>
        </i18n-t>
      </MigrationListItem>
    </MigrationList>
    <BeforeAfter v-if="selectOption !== 'skip'">
      <template #before>
        <HighlightedFilesList
          :files="specFiles.map(x => x.before)"
          highlight-class="text-red-500"
        />
      </template>
      <template #after>
        <HighlightedFilesList
          :files="specFiles.map(x => x.after)"
          highlight-class="text-jade-500"
        />
      </template>
    </BeforeAfter>
    <OptOutModal
      v-if="showOptOutModal"
      :has-custom-integration-folder="props.gql.hasCustomIntegrationFolder"
      @save="(val) => {
        showOptOutModal = false;
        applySkipResult(val)
      }"
      @cancel="showOptOutModal = false"
    />
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue'
import CodeTag from '@cy/components/CodeTag.vue'
import BeforeAfter from './fragments/BeforeAfter.vue'
import HighlightedFilesList from './fragments/HighlightedFilesList.vue'
import MigrationList from './fragments/MigrationList.vue'
import MigrationListItem from './fragments/MigrationListItem.vue'
import MigrationTitle from './fragments/MigrationTitle.vue'
import OptOutModal from './OptOutModal.vue'
import { gql } from '@urql/vue'
import type { RenameSpecsAutoFragment } from '../generated/graphql'
import type { PossibleOption } from './types'
import { useI18n } from '@cy/i18n'
import _ from 'lodash'

const { t } = useI18n()

gql`
fragment RenameSpecsAuto on Migration {
  shouldMigratePreExtension
  hasCustomIntegrationFolder
  specFiles {
    before {
      id
      parts {
        id
        text
        highlight
        group
      }
    }

    after {
      id
      parts {
        id
        text
        highlight
        group
      }
    }
  }
}`

const props = defineProps<{
  gql: RenameSpecsAutoFragment
}>()

const emits = defineEmits<{
  (eventName: 'selectOption', value: PossibleOption): void
}>()

const showOptOutModal = ref(false)

const selectOption = ref<PossibleOption>()

function applySkipResult (val: PossibleOption) {
  selectOption.value = val
  emits('selectOption', selectOption.value)
}

type DeepWriteable<T> = { -readonly [P in keyof T]: DeepWriteable<T[P]> };

type WriteableSpecFile = DeepWriteable<RenameSpecsAutoFragment['specFiles'][number]>

const specFiles = computed(() => {
  if (selectOption.value !== 'renameFolder') {
    return props.gql.specFiles
  }

  return _.cloneDeep(props.gql.specFiles).map((specFile) => {
    const spec = specFile as WriteableSpecFile

    spec.before.parts = spec.before.parts.map((spec) => {
      if (spec.group === 'preExtension') {
        spec.highlight = false
      }

      return spec
    })

    const beforePreExtension = _.find(spec.before.parts, { group: 'preExtension' })

    spec.after.parts = spec.after.parts.map((spec) => {
      if (spec.group === 'preExtension') {
        spec.highlight = false

        if (beforePreExtension) {
          spec.text = beforePreExtension.text
        }
      }

      return spec
    })

    return spec
  })
})
</script>
