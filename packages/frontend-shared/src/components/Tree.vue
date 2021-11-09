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
  >
    <a
      v-for="row, idx in tree"
      :key="idx"
      href="#"
      class="block pt-20px mt-20px focus:bg-red-500 focus:text-white"
      :data-tree-idx="idx"
      :class="{ 'bg-gray-50': row.children, 'hidden': row.hidden.value }"
      :style="{ marginLeft: `${row.depth * 25}px` }"
      @click="onRowClick(row, idx)"
    >
      {{ row.value ? `${row.label}: ${row.value}` : row.label }}
    </a>
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
}

const rootEl: Ref<HTMLElement | undefined> = ref()

const { tree, expand, collapse } = useCollapsibleTree(root)

useListNavigation(rootEl)
</script>
