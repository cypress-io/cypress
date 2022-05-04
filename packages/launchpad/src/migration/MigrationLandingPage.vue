<template>
  <div class="rounded min-h-700px lp-wrapper">
    <h1 class="font-medium text-center pt-20px text-32px text-teal-1000">
      {{ t('migration.landingPage.title') }}
    </h1>
    <p
      class="mx-42px mt-12px text-center mb-32px text-teal-600 text-18px"
    >
      {{ t('migration.landingPage.description') }}
    </p>

    <div class="mx-auto text-center max-w-80vw w-688px ">
      <div
        class="bg-white border-4px-gray-500  w-full video"
        data-cy="video-container"
      />
      <div class="flex bg-gray-50 py-16px px-24px gap-8px">
        <Button @click="handleClick">
          {{ t('migration.landingPage.actionContinue') }}
          <template #suffix>
            <i-cy-arrow-right_x16 />
          </template>
        </Button>
        <Button
          href="https://on.cypress.io/changelog"
          variant="outline"
        >
          <template #prefix>
            <i-cy-book_x16 class="icon-dark-gray-600" />
          </template>
          {{ t('migration.landingPage.linkReleaseNotes') }}
        </Button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import Button from '@cy/components/Button.vue'

import { useI18n } from '@cy/i18n'
const { t } = useI18n()

const emit = defineEmits<{
  (eventName: 'clearLandingPage', value: void): void
}>()

const handleClick = () => {
  emit('clearLandingPage')
}
</script>

<style scoped lang="scss">
.lp-wrapper {
  background-image: url("../images/Background.svg")
}

.video {
  aspect-ratio: 16 / 9;

  // since we support pre-aspect-ratio browsers,
  // the classic padding hack is used here
  // https://css-tricks.com/aspect-ratio-boxes/#aa-the-pseudo-element-tactic
  // https://codepen.io/una/pen/BazyaOM

  @supports not (aspect-ratio: 16 / 9) {
    &::before {
      float: left;
      padding-top: 56.25%;
      content: '';
    }

    &::after {
      display: block;
      content: '';
      clear: both;
    }
  }
}
</style>
