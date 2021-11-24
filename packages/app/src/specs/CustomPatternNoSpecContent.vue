<template>
  <div class="w-full border-1px border-gray-100 rounded">
    <div class="flex justify-between p-14px">
      <InlineCodeFragment>specPattern</InlineCodeFragment>
      <div>
        <button
          class="text-indigo-500"
          @click="emit('showCypressConfigInIDE')"
        >
          cypress.config.js
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
      Update spec pattern
    </Button>
    <Button
      size="lg"
      variant="outline"
      @click="emit('newSpec')"
    >
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
