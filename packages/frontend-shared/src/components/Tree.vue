<template>
  Items,
  <!-- Selected: {{ selectedNode }} -->
  Total Count: {{ tree.length }}
  <button @click="expand">
    Expand
  </button>
  <button @click="collapse">
    Collapse
  </button>
  <div
    ref="rootEl"
    class="h-200px overflow-auto"
    tabindex="0"
  >
    <div
      v-for="row, idx in filteredTree"
      :key="idx"
      :ref="setItemRef"
      href="#"
      class="block pt-20px mt-20px"
      :data-tree-idx="idx"
      :class="{ 'bg-gray-50': row.children, 'hidden': row.hidden.value, 'border-2 border-red-500': selectedItem === idx }"
      :style="{ marginLeft: `${row.depth * 25}px` }"
      tabindex="-1"
      @click="onRowClick(row, idx)"
      @keypress.enter.space.prevent="onRowClick(row, idx)"
    >
      {{ row.value ? `${row.label}: ${row.value}` : row.label }}
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useCollapsibleTree } from '../composables/useCollapsibleTree'
import faker from 'faker'
import { Ref, ref, onBeforeUpdate, computed } from 'vue'
import { useListNavigation } from '../composables/useListNavigation'

const itemRefs = ref([]) as any
const setItemRef = (el) => {
  if (el) {
    itemRefs.value.push(el)
  }
}

onBeforeUpdate(() => {
  itemRefs.value = []
})

const contacts = Array.from(new Array(3).keys()).map(() => {
  return {
    value: faker.name.firstName(),
    label: 'Contact Details',
    id: faker.datatype.uuid(),
    children: [
      { id: faker.datatype.uuid(), value: faker.name.jobDescriptor(), label: 'Job Descriptor' },
      { id: faker.datatype.uuid(), value: faker.name.jobTitle(), label: 'Job Title' },
      { id: faker.datatype.uuid(), value: faker.company.companyName(), label: 'Company Name' },
    ],
  }
})

const root = {
  children: contacts,
  label: 'All Contacts',
  value: '',
  id: faker.datatype.uuid(),
}

const onRowClick = (row, idx) => {
  row.toggle()
  selectedItem.value = idx
}

const rootEl: Ref<HTMLElement | undefined> = ref()

const { tree, expand, collapse } = useCollapsibleTree(root)
const filteredTree = computed(() => tree.filter(((item) => !item.hidden.value)))

const { selectedItem } = useListNavigation(rootEl, itemRefs)
</script>
