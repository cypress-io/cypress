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
    tabindex="0"
    class="h-200px overflow-auto"
  >
    <div
      v-for="row, idx in tree"
      :key="idx"
      class="block pt-20px mt-20px"
      :data-tree-idx="idx"
      :class="{ 'bg-gray-50': row.children, 'hidden': row.hidden.value, 'text-red-500': selectedIndex === idx}"
      :style="{ marginLeft: `${row.depth * 25}px` }"
      @click="onRowClick(row, idx)"
    >
      {{ row.value ? `${row.label}: ${row.value}` : row.label }}
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useCollapsibleTree } from '../composables/useCollapsibleTree'
import faker from 'faker'
import { Ref, ref } from 'vue'
import { useListNavigation } from '../composables/useListNavigation'

const contacts = Array.from(new Array(100).keys()).map(() => {
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
  selectedNode.value = document.querySelector(`[data-list-idx="${idx}"]`)
}

const rootEl: Ref<HTMLElement | undefined> = ref()

const { tree, expand, collapse } = useCollapsibleTree(root)
const { selectedIndex, selectedNode } = useListNavigation(rootEl)
</script>
