<template>
  <div class="w-full border-1px border-gray-100 rounded">
    <div class="flex justify-between p-14px">
      <InlineCodeFragment>specPattern</InlineCodeFragment>
      <div>
        <button
          class="text-indigo-500 flex gap-8px items-center group outline-transparent"
          @click="emit('showCypressConfigInIDE')"
        >
          <i-cy-document-text_x16 class="icon-light-gray-100 icon-dark-gray-500" />
          <span class="group-hocus:underline">cypress.config.js</span>
        </button>
      </div>
    </div>

    <div class="px-16px bg-gray-50 divide-y-1 divide-gray-200">
      <code
        v-for="pattern in specPatterns"
        :key="pattern"
        class="block flex py-8px text-gray-600 text-size-14px leading-24px"
      >
        {{ pattern }}
      </code>
    </div>
  </div>
  <div class="flex justify-center gap-16px mt-32px">
    <Button
      size="lg"
      @click="emit('showCypressConfigInIDE')"
    >
      <template #prefix>
        <i-cy-code-editor_x16 class="icon-dark-white" />
      </template>
      Update spec pattern
    </Button>
    <Button
      size="lg"
      variant="outline"
      @click="emit('newSpec')"
    >
      <template #prefix>
        <i-cy-add-large_x16 class="icon-dark-gray-500" />
      </template>
      New Spec
    </Button>
  </div>
</template>

<script lang="ts" setup>
import InlineCodeFragment from '@cy/components/InlineCodeFragment.vue'
import Button from '@cy/components/Button.vue'

const emit = defineEmits<{
  (e: 'showCypressConfigInIDE'): void
  (e: 'newSpec'): void
}>()

const specPatterns = [
  'cypress/component/*.cy.*.{js,ts,jsx,tsx}',
  '**/__tests__/**/*.cy.[jt]s?(x)',
  'src/**/?(*.)+(cy.|cy.).[jt]s?(x)',
]

</script>
