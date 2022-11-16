<script lang="ts" setup>
import { deriveSpecTree } from "./tree/deriveTree";
import type {
  SpecListOptions,
  SpecTreeDirectoryNode,
  SpecTreeFileNode,
} from "./tree/deriveTree";
import type { SpecsListFragment, Specs_SpecsListFragment } from "../generated/graphql";
import { computed, reactive } from "vue";
import SpecsListDirectory from "./SpecsList/SpecsListDirectory.vue";

const props = defineProps<{
  gql: Specs_SpecsListFragment;
}>();

const opts = reactive<SpecListOptions>({
  sep: "/",
  search: "",
  collapsedDirs: new Set(),
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

const tree = computed(() => {
  return deriveSpecTree(specs.value, opts);
});
</script>

<template>
  <div>
    <SpecsListDirectory
      :node="tree.root"
      :onHandleCollapse="handleCollapse" 
    />
  </div>

</template>
