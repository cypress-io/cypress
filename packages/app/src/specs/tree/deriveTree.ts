export interface SpecListOptions {
  /** either / for posix for \\ for windows */
  sep?: string

  /** string to filter by. */
  search?: string;

  /** Relative paths for all collapsed directories */
  collapsedDirs: Set<string>;
}

export interface SpecTreeDirectoryNode<T extends { relative: string }> {
  name: string;
  type: "directory";
  relative: string;
  parent: SpecTreeDirectoryNode<T> | null;
  /** This is technical derived data.
   *  It's the count of parent.parent.parent... but we cache for perf. reasons.
   */
  depth: number;
  children: Map<string, SpecTreeNode<T>>;
  collapsed: boolean;
}

export interface SpecTreeFileNode<T extends { relative: string }> {
  type: "file";
  name: string;
  data: T;
  parent: SpecTreeDirectoryNode<T>;
}

export type SpecTreeNode<T extends { relative: string }> = SpecTreeFileNode<T> | SpecTreeDirectoryNode<T>;

type DirectoryMap<T extends { relative: string }> = Map<
  string,
  { node: SpecTreeDirectoryNode<T> }
>;

function splitIntoParts(
  path: string,
  sep: string
): { name: string; path: string } {
  if (!path.includes(sep)) {
    return { name: path, path };
  }

  const idx = path.lastIndexOf(sep);

  const name = path.slice(idx + 1);
  const p = path.slice(0, idx);
  return { name, path: p };
}

type BaseSpec = { relative: string }

export function filterFileNodes<T extends BaseSpec>(node: SpecTreeNode<T>): node is SpecTreeFileNode<T> {
  return node.type === "file";
}

export function filterDirectoryNodes<T extends BaseSpec>(
  node: SpecTreeNode<T>
): node is SpecTreeDirectoryNode<T> {
  return node.type === "directory";
}


function isRootLevelSpec(path: string, name: string) {
  return path === name
}

export function deriveSpecTree<T extends { relative: string }>(
  allSpecs: T[],
  options?: Partial<SpecListOptions>
): {
  root: SpecTreeDirectoryNode<T>;
  map: DirectoryMap<T>;
} {

  const sep = options?.sep ?? "/";
  const search = options?.search ?? null;
  const specs = search
    ? allSpecs.filter((x) => x.relative.includes(search))
    : allSpecs;

  const root: SpecTreeDirectoryNode<T> = {
    type: "directory",
    relative: "/",
    name: "/",
    depth: 0,
    parent: null,
    collapsed: options?.collapsedDirs?.has('/') ?? false,
    children: new Map(),
  };


  const map: DirectoryMap<T> = new Map();
  const dirNodes: Map<string, SpecTreeDirectoryNode<T>> = new Map();

  map.set("/", { node: root });
  dirNodes.set("/", root);

  // Derive all the directories based on the specs.
  for (const spec of specs) {
    const { path, name } = splitIntoParts(spec.relative, sep);

    const acc: string[] = [];
    const parts = path.split(sep);

    // Root level spec - no such directory to add, root is already added.
    const isRootSpec = isRootLevelSpec(path, name)

    if (isRootSpec) {
      continue;
    }

    for (let i = 0; i < parts.length; i++) {
      acc.push(parts[i]);
      const dirName = acc.join(sep);

      // Since we add each directory in a depth first fashion,
      // the "parent" will always exist, except in the case of directores
      // under `/`, in which case we just default to root.
      // eg for `cypress/e2e/foo.cy.ts
      //
      // Loop 0: n=undefined, dirName=cypress
      // -> n=undefined, so use root as `parent`
      // -> dirNodes.set("cypress", {...})
      //
      // Loop 1: dirName="cypress"
      // -> parent = dirNodes.get("cypress") // exists!
      // currentDir.parent = parent
      // ... etc ...

      const n = acc.slice(0, acc.length - 1).join(sep);
      const existing = dirNodes.get(n);
      const parent = existing ?? root;

      let depth = 1
      let p: SpecTreeDirectoryNode<T> | null = parent
      while (p = p.parent) {
        depth++
      }

      const node: SpecTreeDirectoryNode<T> = {
        type: "directory",
        relative: dirName,
        name: parts[i],
        parent,
        depth,
        children: new Map(),
        collapsed: options?.collapsedDirs?.has(dirName) ?? false,
      };

      dirNodes.set(dirName, node);
      map.set(acc.join(sep), { node });
    }
  }

  const recursivelyAssignDirectories = (node: SpecTreeDirectoryNode<T>) => {
    if (node.relative === 'cypress') {
    }
    if (node.parent) {
      map.get(node.parent.relative)?.node.children.set(node.relative, node);
      recursivelyAssignDirectories(node.parent);
    }
  };

  // Next, we assign the children directories for each directory.
  // We recurse *up* until parent is null, which means which reached the root.
  // Mutating becuase it's way faster and easier to grok.
  for (const childNode of dirNodes.values()) {
    recursivelyAssignDirectories(childNode);
  }

  // Add specs to directory's children.
  for (const spec of specs) {
    let { name, path } = splitIntoParts(spec.relative, sep);
    path ||= "/";

    const parent = isRootLevelSpec(spec.relative, name)
      ? root
      : map.get(path)?.node;
    
    if (!parent) {
      throw Error(
        `Could not find directory node with key '${path}'. This should never happen.`
      );
    }

    // Finally, add the spec to the correct directory.
    const fileNode: SpecTreeFileNode<T> = {
      name,
      type: "file",
      data: spec,
      parent,
    };

    parent.children.set(name, fileNode);
  }

  const rootNode = map.get("/")?.node;

  if (!rootNode) {
    throw Error("Could not find root node");
  }

  return {
    root: rootNode,
    map,
  };
}

export function createSpec (
  p: string,
  name: string
) {
  const prefix = p.length > 0 ? `${p}/` : ``;

  return {
    name: `${prefix}${name}.cy.ts`,
    specType: "integration",
    absolute: `/${prefix}${name}.cy.ts`,
    baseName: name,
    fileName: name,
    specFileExtension: ".cy.ts",
    fileExtension: ".ts",
    relative: `${prefix}${name}.cy.ts`,
  };
}

interface GroupedNodes<T extends {relative: string}> {
  files: SpecTreeFileNode<T>[]
  directories: SpecTreeDirectoryNode<T>[]
}

export function groupSpecTreeNodes<T extends BaseSpec> (node: SpecTreeDirectoryNode<T>): GroupedNodes<T> {
  return array(node.children).reduce<GroupedNodes<T>>((acc, curr) => {
    if (curr.type === 'file') {
      acc.files.push(curr)
    } else {
      acc.directories.push(curr)
    }
    return acc
  }, {
    files: [],
    directories: []
  });
}

export function array<T>(list: Set<T> | Map<string, T>): T[] {
  return Array.from(list.values());
}

export function getAllFileInDirectory<T extends BaseSpec>(node: SpecTreeDirectoryNode<T>): SpecTreeFileNode<T>[] {
  const files: SpecTreeFileNode<T>[] = []

  function walk (node: SpecTreeNode<T>) {
    if (node.type === 'file') {
      files.push(node)
    } else {
      // continue...
      Array.from(node.children.values()).map(n => walk(n))
    }
  }

  walk(node)

  return files
}