<template>
  <div
    v-if="migration"
    class="text-16px leading-24px"
  >
    <MigrationTitle :title="t('migration.configFile.title')" />
    <MigrationList>
      <MigrationListItem>
        {{ t("migration.configFile.changedDefault") }}
        <CodeTag class="text-red-500">
          cypress.json
        </CodeTag>
        <i-cy-arrow-right_x16 class="h-16px w-16px inline-block icon-dark-gray-300" />
        <CodeTag class="text-jade-500">
          {{ fileName }}
        </CodeTag>
      </MigrationListItem>
      <MigrationListItem v-if="migration.hasCustomIntegrationFolder || migration.hasCustomIntegrationTestFiles">
        <i18n-t
          scope="global"
          keypath="migration.configFile.customOptions"
        >
          <template #specPattern>
            <CodeTag class="text-jade-500">
              e2e/specPattern
            </CodeTag>
          </template>
          <template #options>
            <template v-if="migration.hasCustomIntegrationFolder && migration.hasCustomIntegrationTestFiles">
              <CodeTag class="text-red-500">
                integrationFolder
              </CodeTag> and <CodeTag class="text-red-500">
                testFiles
              </CodeTag> options
            </template>
            <template v-else-if="migration.hasCustomIntegrationFolder">
              <CodeTag class="text-red-500">
                integrationFolder
              </CodeTag> option
            </template>
            <template v-else-if="migration.hasCustomIntegrationTestFiles">
              <CodeTag class="text-red-500">
                testFiles
              </CodeTag> option
            </template>
          </template>
        </i18n-t>
      </MigrationListItem>
      <MigrationListItem v-if="migration.hasCustomComponentFolder || migration.hasCustomComponentTestFiles">
        <i18n-t
          scope="global"
          keypath="migration.configFile.customOptions"
        >
          <template #specPattern>
            <CodeTag class="text-jade-500">
              component/specPattern
            </CodeTag>
          </template>
          <template #options>
            <template v-if="migration.hasCustomComponentFolder && migration.hasCustomComponentTestFiles">
              <CodeTag class="text-red-500">
                componentFolder
              </CodeTag> and <CodeTag class="text-red-500">
                testFiles
              </CodeTag> options
            </template>
            <template v-else-if="migration.hasCustomComponentFolder">
              <CodeTag class="text-red-500">
                componentFolder
              </CodeTag> option
            </template>
            <template v-else-if="migration.hasCustomComponentTestFiles">
              <CodeTag class="text-red-500">
                testFiles
              </CodeTag> option
            </template>
          </template>
        </i18n-t>
      </MigrationListItem>
      <MigrationListItem>
        <i18n-t
          scope="global"
          keypath="migration.configFile.willConvert"
        >
          <template #jsonFile>
            <CodeTag class="text-red-500">
              cypress.json
            </CodeTag>
          </template>
          <template #jsFile>
            <CodeTag class="text-jade-500">
              {{ fileName }}
            </CodeTag>
          </template>
        </i18n-t>
      </MigrationListItem>
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
          {{ fileName }}
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
import MigrationListItem from './fragments/MigrationListItem.vue'

const { t } = useI18n()

gql`
fragment ConvertConfigFile on Query {
  migration {
    configBeforeCode
    configAfterCode
    hasCustomIntegrationFolder
    hasCustomIntegrationTestFiles
    hasCustomComponentFolder
    hasCustomComponentTestFiles
  }
  currentProject {
    id
    hasTypescript
  }
}`

const props = defineProps<{
  gql?: ConvertConfigFileFragment
}>()

const migration = computed(() => props.gql?.migration)

const gqlCodeBeforeLines = computed(() => props.gql?.migration?.configBeforeCode.split('\n').length ?? 0)
const gqlCodeAfterLines = computed(() => props.gql?.migration?.configAfterCode.split('\n').length ?? 0)
const gqlCodeMaxLines = computed(() => Math.max(gqlCodeBeforeLines.value, gqlCodeAfterLines.value))

const codeBefore = computed(() => {
  return props.gql?.migration?.configBeforeCode + Array(gqlCodeMaxLines.value - gqlCodeBeforeLines.value).fill('\n').join('')
})

const codeAfter = computed(() => {
  return props.gql?.migration?.configAfterCode + Array(gqlCodeMaxLines.value - gqlCodeAfterLines.value).fill('\n').join('')
})

const fileName = computed(() => props.gql?.currentProject?.hasTypescript ? 'cypress.config.ts' : 'cypress.config.js')
</script>

<style lang="scss" scoped>
.before\:block {
  content:'';
}
</style>
