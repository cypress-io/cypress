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
        <div class="h-full relative before:bg-gray-50 before:top-0 before:bottom-0 before:w-40px before:absolute before:block">
          <ShikiHighlight
            :code="codeBefore"
            lang="json"
            line-numbers
          />
        </div>
      </template>
      <template #after>
        <div class="h-full bg-gray-50">
          <ShikiHighlight
            :code="codeAfter"
            lang="js"
            line-numbers
          />
        </div>
      </template>
    </BeforeAfter>
  </div>
</template>

<script lang="ts" setup>
import CodeTag from '@cy/components/CodeTag.vue'

import { useI18n } from '@cy/i18n'
import BeforeAfter from './fragments/BeforeAfter.vue'
import ShikiHighlight from '../../../frontend-shared/src/components/ShikiHighlight.vue'
import MigrationList from './fragments/MigrationList.vue'
import MigrationTitle from './fragments/MigrationTitle.vue'

const { t } = useI18n()

// TODO: wire this properly
const codeBefore = `{
  "baseUrl": "http://localhost:1234/",
  "retries": 2
}`

// TODO: wire this properly
const codeAfter = `const { defineConfig } = require('cypress')

module.exports = defineConfig({
  retries: 2,
  e2e: {
    // End-to-end config overrides go here
    baseUrl: "http://localhost:1234/"

    setupNodeEvents (on, config) {
      // We've imported your old cypress plugins here.
      // You may want to clean this up later by importing these directly
      return require('cypress/plugins/index.js')(on, config) }
    }
  },
})`
</script>

<style lang="scss" scoped>
.before\:block {
  content:'';
}
</style>
