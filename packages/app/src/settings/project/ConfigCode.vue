<template>
  <div class="relative grow-1 w-full hide-scrollbar rounded-bl-md rounded-tl-md mx-auto border-1 overflow-auto min-w-100px">
    <Button
      variant="outline"
      class="absolute top-4 right-4"
      :prefix-icon="IconCode"
      prefix-icon-class="text-gray-500"
    >
      {{ t('file.edit') }}
    </Button>
    <code
      class="block p-16px text-gray-600 text-size-14px leading-24px font-thin"
    >
      {<br>
      <div class="pl-24px">
        <span
          v-for="{ field, value, from } in config"
          :key="field"
        >
          {{ field }}:
          <Browsers
            v-if="field === 'browsers' && Array.isArray(value)"
            :browsers="value"
            :color-classes="`rounded-sm px-2px ${colorMap[from]}`"
          />
          <StringArray
            v-else-if="value && Array.isArray(value)"
            :value="value"
            :color-classes="`rounded-sm px-2px ${colorMap[from]}`"
          />
          <StringRecords
            v-else-if="value && typeof value === 'object'"
            :value="value"
            :color-classes="`rounded-sm px-2px ${colorMap[from]}`"
          />
          <span
            v-else
            class="rounded-sm px-2px"
            :class="colorMap[from]"
          >
            {{ !value
              ? 'null'
              : typeof value === 'string'
                ? `'${value}'`
                : value }}
          </span>,
          <br>
        </span>
      </div>
      }
    </code>
  </div>
</template>

<script lang="ts" setup>
import Button from '@cy/components/Button.vue'
import IconCode from '~icons/mdi/code'
import { useI18n } from '@cy/i18n'
import { CONFIG_LEGEND_COLOR_MAP } from './ConfigSourceColors'
import Browsers from './renderers/Browsers.vue'
import StringArray from './renderers/StringArray.vue'
import StringRecords from './renderers/StringRecords.vue'

defineProps<{
  config: Array<{
    field: string,
    from: 'default'| 'config',
    value: string | number | boolean | Record<string, string> | Array<string | number | boolean>
  }>
}>()

// a bug in vite ddemands that we do this passthrough
const colorMap = CONFIG_LEGEND_COLOR_MAP

const { t } = useI18n()
</script>
