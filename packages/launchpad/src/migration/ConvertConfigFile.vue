<template>
  <div class="text-16px leading-24px">
    <MigrationTitle :title="t('migration.configFile.title')" />
    <MigrationList>
      <template #line-1>
        <i18n-t keypath="migration.configFile.changedTheFile">
          <template #jsonFile>
            <CodeTag class="text-red-500">
              cypress.json
            </CodeTag>
          </template>
          <template #jsFile>
            <CodeTag class="text-jade-500">
              cypress.config.js
            </CodeTag>
          </template>
        </i18n-t>
      </template>
      <template #line-2>
        <i18n-t keypath="migration.configFile.willConvert">
          <template #jsonFile>
            <CodeTag class="text-red-500">
              cypress.json
            </CodeTag>
          </template>
          <template #jsFile>
            <CodeTag class="text-jade-500">
              cypress.config.js
            </CodeTag>
          </template>
        </i18n-t>
      </template>
      <template #line-3>
        <i18n-t keypath="migration.configFile.removeJson">
          <CodeTag class="text-red-500">
            cypress.json
          </CodeTag>
        </i18n-t>
      </template>
    </MigrationList>
    <BeforeAfter>
      <template #beforeHeader>
        <span class="mr-8px">{{ t('migration.before') }}</span>
        <CodeTag
          bg
          class="bg-red-100 text-red-600"
        >
          cypress.json
        </CodeTag>
      </template>
      <template #afterHeader>
        <span class="mr-8px">{{ t('migration.after') }}</span>
        <CodeTag
          bg
          class="bg-jade-100 text-jade-600"
        >
          cypress.config.js
        </CodeTag>
      </template>
      <template #before>
        <ShikiHighlight
          :code="codeBefore"
          lang="json"
          line-numbers
          skip-trim
        />
      </template>
      <template #after>
        <ShikiHighlight
          :code="codeAfter"
          lang="js"
          line-numbers
          skip-trim
        />
      </template>
    </BeforeAfter>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import CodeTag from '@cy/components/CodeTag.vue'
import BeforeAfter from './fragments/BeforeAfter.vue'
import ShikiHighlight from '../../../frontend-shared/src/components/ShikiHighlight.vue'
import MigrationList from './fragments/MigrationList.vue'
import MigrationTitle from './fragments/MigrationTitle.vue'
import { useI18n } from '@cy/i18n'
import { gql } from '@urql/vue'
import type { ConvertConfigFileFragment } from '../generated/graphql'

const { t } = useI18n()

gql`
fragment ConvertConfigFile on Migration {
  configBeforeCode
  configAfterCode
}`

const props = defineProps<{
  gql: ConvertConfigFileFragment
}>()

const gqlCodeBeforeLines = computed(() => props.gql.configBeforeCode.split('\n').length)
const gqlCodeAfterLines = computed(() => props.gql.configAfterCode.split('\n').length)
const gqlCodeMaxLines = computed(() => Math.max(gqlCodeBeforeLines.value, gqlCodeAfterLines.value))

const codeBefore = computed(() => {
  return props.gql.configBeforeCode + Array(gqlCodeMaxLines.value - gqlCodeBeforeLines.value).fill('\n').join('')
})

const codeAfter = computed(() => {
  return props.gql.configAfterCode + Array(gqlCodeMaxLines.value - gqlCodeAfterLines.value).fill('\n').join('')
})
</script>

<style lang="scss" scoped>
.before\:block {
  content:'';
}
</style>
