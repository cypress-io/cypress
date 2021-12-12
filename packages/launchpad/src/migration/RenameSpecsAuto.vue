<template>
  <div class="text-16px leading-24px">
    <h3 class="font-medium my-8px text-gray-900 leading-28px">
      We'll automatically rename your specs in this step — here's why:
    </h3>
    <ul class="list-disc pl-24px text-jade-400">
      <li class="mb-4px">
        <span class="text-gray-600">
          We've changed the default spec folder from:
        </span>
        <CodeTag
          class="text-red-500"
        >cypress/integration</CodeTag>
        <i-cy-arrow-right_x16 class="h-16px w-16px inline-block icon-dark-gray-300" />
        <CodeTag
          class="text-jade-500"
        >cypress/e2e</CodeTag>
      </li>
      <li class="mb-4px">
        <span class="text-gray-600">
          We've changed the default spec file extension from:
        </span>
        <CodeTag
          class="text-red-500"
        >[filename].spec.[ext]</CodeTag>
        <i-cy-arrow-right_x16 class="h-16px w-16px inline-block icon-dark-gray-300" />
        <CodeTag
          class="text-jade-500"
        >[filename].cy.[ext]</CodeTag>
      </li>
      <li class="mb-4px">
        <span class="text-gray-600">
          Since you're currently using a custom directory for the <CodeTag>integrationFolder</CodeTag>, we'll temporarily be moving your specs back to the default directory.
        </span>
      </li>
    </ul>
    <BeforeAfter>
      <template #before>
        <HighlightedFilesList
          :files="filesBefore"
          :highlight-reg-exp="/(integration|[_,-,.]?spec)/gi"
          highlight-class="text-red-500"
        />
      </template>
      <template #after>
        <HighlightedFilesList
          :files="filesAfter"
          :highlight-reg-exp="/(e2e|\.cy)/gi"
        />
      </template>
    </BeforeAfter>
  </div>
</template>

<script lang="ts" setup>
import CodeTag from '@cy/components/CodeTag.vue'
import BeforeAfter from './fragments/BeforeAfter.vue'
import HighlightedFilesList from './fragments/HighlightedFilesList.vue'

// TODO: wire this properly
const filesBefore = [
  'cypress/integration/app_spec.js',
  'cypress/integration/blog-post-spec.js',
  'cypress/integration/homeSpec.js',
  'cypress/integration/company.js',
  'cypress/integration/sign-up.spec.js',
  'cypress/component/button.spec.js',
]

// TODO: wire this properly
const filesAfter = [
  'cypress/e2e/app.cy.js',
  'cypress/e2e/blog-post.cy.js',
  'cypress/e2e/homeSpec.cy.js',
  'cypress/e2e/company.cy.js',
  'cypress/e2e/sign-up.cy.js',
  'cypress/component/button.cy.js',
]
</script>
