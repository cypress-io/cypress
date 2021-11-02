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
      <span class="line">{</span>
      <span
        v-for="(value, key) in config"
        :key="key"
        class="line"
      ><template v-if="value.value">  {{ key }}: <span
        :class="CONFIG_LEGEND_COLOR_MAP[value.from]"
      ><Browsers
        v-if="key==='browsers' && Array.isArray(value.value)"
        :browsers="value.value"
      /><BlockHosts
        v-else-if="key==='blockHosts' && Array.isArray(value.value)"
        :block-hosts="value.value"
      /><Hosts
        v-else-if="key==='hosts' && typeof value.value === 'object' && !Array.isArray(value.value)"
        :hosts="value.value"
      /><template
        v-else
      >{{ typeof value.value === 'string' ? `'${value.value}'` : value.value }}</template></span>,</template></span>
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
import BlockHosts from './renderers/BlockHosts.vue'
import Hosts from './renderers/Hosts.vue'

defineProps<{
  config: Record<string, { from: 'default'| 'config', value: string | number | boolean | Record<string, string> | Array<string | number | boolean> }>
}>()

const { t } = useI18n()
</script>

<style lang="scss" scoped>
  .line-numbers:deep(.shiki) {
    code {
      counter-reset: step;
      counter-increment: step 0;

      // Keep bg-gray-50 synced with the box-shadows.
      .line::before, .line:first-child::before {
        @apply bg-gray-50 text-gray-500 min-w-40px inline-block text-right px-8px mr-16px sticky;
        left: 0px !important;
        content: counter(step);
        counter-increment: step;
      }

      // Adding padding to the top and bottom of these children adds unwanted
      // line-height to the line. This doesn't look good when you select the text.
      // To avoid this, we use box-shadows and offset the parent container.
      .line:first-child::before {
        box-shadow: 0 (-1 * $offset) theme('colors.gray.50') !important;
      }

      .line:last-child::before {
        box-shadow: 0 $offset theme('colors.gray.50') !important;
      }
    }
  }
</style>
