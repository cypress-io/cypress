<template>
  <div class="flex flex-col h-full text-center justify-center items-center">
    <i-cy-no-internet_x48
      data-cy="no-connection-icon"
      aria-hidden
      class="h-[48px] w-[48px] icon-dark-gray-500 icon-light-gray-100 icon-dark-secondary-jade-400 icon-light-secondary-jade-200"
    />
    <h2 class="mt-[24px] mb-[4px] text-gray-900 text-[18px] leading-[24px] w-[640px]">
      {{ t("launchpadErrors.noInternet.header") }}
    </h2>
    <p class="font-normal mt-[8px] mb-[24px] text-gray-600 text-[16px] leading-[24px] w-[672px]">
      <slot />
    </p>
  </div>
</template>

<script lang="ts" setup>
import { useI18n } from '@cy/i18n'

const { t } = useI18n()

</script>
