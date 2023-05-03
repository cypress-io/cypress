<template>
  <div
    class="border rounded bg-gray-100 border-gray-100 mt-[16px]
      w-full grid gap-[1px] grid-rows-[48px,1fr] grid-cols-2 overflow-hidden"
  >
    <div class="flex font-semibold bg-gray-50 px-[16px] text-gray-800 items-center">
      <slot name="beforeHeader">
        {{ t('migration.before') }}
      </slot>
    </div>
    <div class="flex font-semibold bg-gray-50 px-[16px] text-gray-800 items-center">
      <slot name="afterHeader">
        {{ t('migration.after') }}
      </slot>
    </div>
    <div
      class="bg-white"
      data-cy="migrate-before"
    >
      <slot name="before" />
    </div>
    <div
      class="bg-white"
      data-cy="migrate-after"
    >
      <slot name="after" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useI18n } from '@cy/i18n'

const { t } = useI18n()
</script>
