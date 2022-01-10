<template>
  <div class="rounded-bl-md rounded-tl-md mx-auto border-1 w-full min-w-100px relative hide-scrollbar overflow-auto grow-1">
    <Button
      variant="outline"
      class="top-4 right-4 absolute"
      :prefix-icon="IconCode"
      prefix-icon-class="text-gray-500"
    >
      {{ t('file.edit') }}
    </Button>
    <code
      class="font-thin p-16px text-gray-600 text-size-14px leading-24px block"
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
          <RenderObject
            v-else-if="value && typeof value === 'object'"
            :value="value"
            :color-classes="`rounded-sm px-2px ${colorMap[from]}`"
          />
          <span
            v-else
            class="rounded-sm px-2px"
            :class="colorMap[from]"
          >{{ renderPrimitive(value) }}</span>,
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
import type { CypressResolvedConfig } from './projectSettings'
import RenderObject from './renderers/RenderObject.vue'
import { renderPrimitive } from './renderers/renderPrimitive'

defineProps<{
  config: CypressResolvedConfig
}>()

// a bug in vite demands that we do this passthrough
const colorMap = CONFIG_LEGEND_COLOR_MAP

const { t } = useI18n()
</script>
