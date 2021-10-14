<script lang="ts" setup>
import { computed, ref } from 'vue'
import 'prismjs'
import 'prismjs/plugins/line-numbers/prism-line-numbers.css'
import '@packages/frontend-shared/src/styles/prism.scss'
import ListRow from '@cy/components/ListRow.vue'
import Button from '@cy/components/Button.vue'
import Badge from '@cy/components/Badge.vue'
import PrismJs from 'vue-prism-component'

const props = defineProps<{
    status: 'changes' | 'valid' | 'skipped' | 'error'
    filePath: string
    content: string
    description?: string | null
    warningText?: string | null
    warningLink?: string | null
}>()

const language = computed(() => /\.(\w+)$/.exec(props.filePath)?.[1])

const open = ref(false)

const prismInstalled = ref(false)

Promise.all([
  import('prismjs/components/prism-typescript'),
  import('prismjs/components/prism-json'),
  import('prismjs/plugins/line-numbers/prism-line-numbers'),
]).then(() => {
  prismInstalled.value = true
})

const statusLabel = computed(() => props.status === 'skipped' ? 'Skipped' : props.status === 'changes' ? 'Changes required' : undefined)
const statusClasses = computed(() => props.status === 'skipped' ? 'skipped' : props.status === 'changes' ? 'warning' : undefined)

</script>

<template>
  <ListRow @click="open = !open">
    <template #icon>
      <i-cy-file-changes-added_x24
        v-if="status === 'valid'"
        class="w-24px h-24px"
      />
      <i-cy-file-changes-warning_x24
        v-if="status === 'changes'"
        class="w-24px h-24px"
      />
      <i-cy-file-changes-skipped_x24
        v-if="status === 'skipped'"
        class="w-24px h-24px"
      />
      <i-cy-file-changes-error_x24
        v-if="status === 'error'"
        class="w-24px h-24px"
      />
    </template>
    <template #header>
      <span class="inline-block align-top">{{ filePath }}</span>
      <Badge
        v-if="statusLabel && statusClasses && !open"
        :label="statusLabel"
        :status="statusClasses"
      />
    </template>
    <template #description>
      <span v-html="description" />
    </template>
    <template #right>
      <i-cy-dropcaret />
    </template>
    <template #slider>
      <div
        v-if="warningText && open"
        class="flex items-center p-3 border-t border-gray-200 bg-warning-100 text-warning-600"
      >
        <span class="font-semibold">{{ statusLabel }}: </span>
        <p
          class="flex-grow ml-1"
          v-html="warningText"
        />
        <Button>Learn more</Button>
      </div>
      <div
        v-if="prismInstalled"
        class="p-3 pt-4 overflow-auto border-t border-gray-100"
        :class="open ? 'block': 'hidden'"
      >
        <PrismJs
          :key="language"
          :language="language"
        >
          {{ content }}
        </PrismJs>
      </div>
    </template>
  </ListRow>
</template>
