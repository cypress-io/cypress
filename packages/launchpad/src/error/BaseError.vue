<template>
  <div class="max-w-565px min-w-476px mx-auto mt-40px space-y-32px children:text-center text-center">
    <div>
      <h1 class="text-32px font-medium text-gray-900 leading-snug">
        
        <slot name="header">{{ t('launchpadErrors.generic.header') }}</slot>
      </h1>
      <slot name="text">

          <i18n-t keypath="launchpadErrors.generic.text" tag="p" class="font-light">
              <a class="text-indigo-500 underline-indigo-500 outline-none hocus:underline underline-indigo-500 ring-indigo-500"
                href="https://docs.cypress.io"
                target="_blank"
              >cypress.config.js</a>
          </i18n-t>
          <!-- {{ t('launchpadErrors.generic.text') }} -->

      </slot>
    </div>
    <i-cy-placeholder_x48 class="w-120px h-120px mx-auto my-0 icon-light-gray-50 icon-dark-gray-200"></i-cy-placeholder_x48>
    <div class="inline-flex gap-16px justify-between">
      <slot name="cta">
        <Button size="lg" variant="primary">{{ t('launchpadErrors.generic.retryButton') }}</Button>
        <Button size="lg" variant="outline">{{ t('launchpadErrors.generic.readTheDocsButton') }}</Button>
      </slot>
    </div>
  </div>
</template>

<script lang="ts" setup>
import Button from '@cy/components/Button.vue';
import { useI18n } from '@cy/i18n';

const { t } = useI18n()

defineProps<{
  header: string
  text: string
}>()

defineEmits<{
  retry: () => void,
  clickDocs: () => void
}>()
</script>
