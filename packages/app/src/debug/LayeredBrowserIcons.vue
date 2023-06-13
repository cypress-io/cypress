<template>
  <ul
    data-cy="layered-browser-icons"
    class="flex mr-[8px] pl-[8px]"
  >
    <li
      v-for="(result, i) in results"
      :key="i"
      class="rounded-full rounded flex h-5 ml-[-8px] w-5 items-center justify-center"
      :class="(results.length > 1 ? 'bg-gray-50' : '')"
    >
      <component
        :is="result.icon"
        :data-cy="result.name"
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
  IconBrowserChromeBeta,
} from '@cypress-design/vue-icon'

// Note: These browser names should map to the list of logoPaths found at https://github.com/cypress-io/cypress-services/blob/46073cb5c387af3b203404280a1664a85e233b93/packages/common/src/logos/getLogoPath.ts
// Some of these are currently incorrect (ex: CHROME-CANARY).
// We are also missing browsers from the list as well
export type BrowserType = 'CHROME' | 'SAFARI' | 'FIREFOX' | 'CHROME-CANARY' | 'CHROME BETA' | 'EDGE' | 'WEBKIT' | 'ELECTRON'

interface LayeredProps {
  browsers: BrowserType[]
}

const props = defineProps<LayeredProps>()

const results = computed(() => {
  if (props.browsers) {
    return props.browsers.map((browserType) => {
      return {
        icon: BROWSER_MAP[browserType],
        name: `browser-icon-${browserType.toLowerCase().replaceAll(' ', '_')}`,
      }
    })
  }

  return []
})

const BROWSER_MAP: Record<BrowserType, any> = {
  'CHROME': IconBrowserChrome,
  'CHROME BETA': IconBrowserChromeBeta,
  'CHROME-CANARY': IconBrowserChromeCanary,
  'SAFARI': IconBrowserSafari,
  'FIREFOX': IconBrowserMozillaFirefox,
  'EDGE': IconBrowserEdge,
  'WEBKIT': IconBrowserWebkit,
  'ELECTRON': IconBrowserElectronLight,
}

</script>
