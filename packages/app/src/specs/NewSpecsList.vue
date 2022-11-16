<script lang="ts" setup>
import { deriveSpecTree, fuzzySortSpecs } from "./tree/deriveTree";
import type {
  SpecListOptions,
  SpecTreeDirectoryNode,
} from "./tree/deriveTree";
import type { SpecsListFragment, Specs_SpecsListFragment } from "../generated/graphql";
import { computed, reactive } from "vue";
import SpecsListDirectory from "./SpecsList/SpecsListDirectory.vue";
import { getPlatform } from "./tree/useCollapsibleTree";

const props = defineProps<{
  gql: Specs_SpecsListFragment;
}>();

const opts = reactive<SpecListOptions<SpecsListFragment>>({
  sep: "/",
  search: "",
  collapsedDirs: new Set(),
  searchFn: fuzzySortSpecs
});

const handleCollapse = (node: SpecTreeDirectoryNode<SpecsListFragment>) => {
  const contained = opts.collapsedDirs.has(node.relative);
  if (contained) {
    opts.collapsedDirs = new Set(
      [...opts.collapsedDirs.values()].filter((x) => x !== node.relative)
    );
  } else {
    opts.collapsedDirs = new Set([
      ...opts.collapsedDirs.values(),
      node.relative,
    ]);
  }
};

const specs = computed(() => props.gql.currentProject?.specs.slice() ?? [])

const normalizedSearchValue = (str: string = '') => getPlatform() === 'win32' ? str.replaceAll('/', '\\') : str

const tree = computed(() => {
  return deriveSpecTree(specs.value, {...opts, search: normalizedSearchValue(opts.search) });
});
</script>

<template>
  <input v-model="opts.search" placeholder="Search..." />
  <div>
    <SpecsListDirectory
      :node="tree.root"
      :onHandleCollapse="handleCollapse" 
    />
  </div>

</template>
