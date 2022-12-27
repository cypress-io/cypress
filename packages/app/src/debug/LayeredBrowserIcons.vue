<template>
  <ul
    data-cy="layered-browser-icons"
    class="flex pl-8px mr-8px"
  >
    <li
      v-for="(result, i) in results"
      :key="i"
      class="-ml-8px rounded-full h-5 w-5 flex items-center justify-center rounded"
      :class="(results.length > 1 ? 'bg-gray-50' : '')"
    >
      <component
        :is="result"
        size="16"
      />
    </li>
  </ul>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { IconBrowserChrome,
  IconBrowserChromeCanary,
  IconBrowserSafari,
  IconBrowserMozillaFirefox,
  IconBrowserEdge,
  IconBrowserWebkit,
  IconBrowserElectronLight,
} from '@cypress-design/vue-icon'

interface LayeredProps {
  order: BrowserType[]
}

const props = defineProps<LayeredProps>()

const results = computed(() => {
  if (props.order) {
    return props.order.map((status) => BROWSER_MAP[status])
  }

  return []
})

type BrowserType = 'CHROME' | 'SAFARI' | 'FIREFOX' | 'CHROME-CANARY' | 'EDGE' | 'WEBKIT' | 'ELECTRON'

const BROWSER_MAP: Record<BrowserType, any> = {
  'CHROME': IconBrowserChrome,
  'CHROME-CANARY': IconBrowserChromeCanary,
  'SAFARI': IconBrowserSafari,
  'FIREFOX': IconBrowserMozillaFirefox,
  'EDGE': IconBrowserEdge,
  'WEBKIT': IconBrowserWebkit,
  'ELECTRON': IconBrowserElectronLight,
}

</script>
