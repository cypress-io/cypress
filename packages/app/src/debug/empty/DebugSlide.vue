<template>
  <div
    class="w-680px"
    data-cy="debug-slideshow-slide"
  >
    <img
      :src="img"
      :alt="t('debugPage.emptyStates.slideshow.imgAlt')"
    >
    <div class="rounded-b-md bg-purple-500 text-white p-16px">
      <h2 class="font-semibold">
        {{ title }}
      </h2>
      <p class="text-white text-sm mb-16px text-opacity-70">
        {{ description }}
      </p>
      <div class="flex justify-between">
        <span data-cy="debug-slideshow-step">{{ step }}/{{ totalSteps -1 }}</span>
        <div class="flex gap-8px">
          <Button
            v-if="step > 1"
            variant="outline"
            class="flex slide-override"
            :prefix-icon="IconChevronLeftSmall"
            @click="decrementStep"
          >
            {{ t('debugPage.emptyStates.slideshow.controls.previous') }}
          </Button>
          <Button
            v-if="step < (totalSteps - 1)"
            variant="outline"
            class="slide-override"
            :suffix-icon="IconChevronRightSmall"
            @click="incrementStep"
          >
            {{ t('debugPage.emptyStates.slideshow.controls.next') }}
          </Button>
          <!-- Set width on this element to remove thrashing between "Done" and "Next" lengths  -->
          <Button
            v-else
            variant="outline"
            class="w-80px slide-override"
            @click="incrementStep"
          >
            {{ t('debugPage.emptyStates.slideshow.controls.done') }}
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Button from '@cy/components/Button.vue'
import { IconChevronLeftSmall, IconChevronRightSmall } from '@cypress-design/vue-icon'
import { useI18n } from '@cy/i18n'

const { t } = useI18n()

defineProps<{
  img: string
  title: string
  description: string
  step: number
  totalSteps: number
  incrementStep: () => void
  decrementStep: () => void
}>()

</script>

<style>
button.slide-override {
  color: white !important
}
</style>
