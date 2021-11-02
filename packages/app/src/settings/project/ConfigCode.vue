<template>
  <div class="relative grow-1 w-full hide-scrollbar rounded-bl-md rounded-tl-md mx-auto border-1 overflow-auto min-w-100px select-none">
    <Button
      variant="outline"
      class="absolute top-4 right-4"
      :prefix-icon="IconCode"
      prefix-icon-class="text-gray-500"
    >
      {{ t('file.edit') }}
    </Button>
    <code
      class="p-2 font-mono text-gray-600 text-sm"
    >
      <span class="line">{</span><br>
      <div class="pl-24px">
        <span
          v-for="{ field, value, from } in config"
          :key="field"
          class="line"
        >
          <template v-if="value">  {{ field }}: <span
            :class="colorMap[from]"
          >
            <Browsers
              v-if="field==='browsers' && Array.isArray(value)"
              :browsers="value"
            />
            <StringArray
              v-else-if="Array.isArray(value)"
              :value="value"
            />
            <StringRecords
              v-else-if="typeof value === 'object'"
              :value="value"
            />
            <template
              v-else
            >{{ typeof value === 'string' ? `'${value}'` : value }}</template>
          </span>,
          </template><br>
        </span>
      </div>
      <span class="line">}</span>
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
  config: Array<{ field: string, from: 'default'| 'config', value: string | number | boolean | Record<string, string> | Array<string | number | boolean> }>
}>()

// a bug in vite ddemands that we do this passthrough
const colorMap = CONFIG_LEGEND_COLOR_MAP

const { t } = useI18n()
</script>
