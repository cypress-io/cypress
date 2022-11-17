import fuzzysort from "fuzzysort";

type SearchFn<T extends BaseSpec> = (search: string, specs: T[]) => T[];

export interface SpecListOptions<T extends BaseSpec> {
  /** either / for posix for \\ for windows */
  sep?: string;

  /** String to filter by. Passed to the searchFn. */
  search?: string;

  /** Search function. Defaults to a basic string filter. */
  searchFn?: SearchFn<T>;

  /** Relative paths for all collapsed directories */
  collapsedDirs: Set<string>;
}

export interface SpecTreeDirectoryNode<T extends BaseSpec> {
  name: string;
  type: "directory";
  relative: string;
  /**
   * Only ever null for the root node.
   */
  parentPath: string | null;
  parent: SpecTreeDirectoryNode<T> | null;
  /** 
   * How deep is the node? Derive via parent.parent.parent...
   */
  depth: number;
  /**
   * A directory can have other directories or files as children.
   */
  children: Array<SpecTreeNode<T>>;
  /**
   * Is it collapsed? This is purely a UI concern, but we manage it here for simplicity.
   */
  collapsed: boolean;
}

export interface SpecTreeFileNode<T extends BaseSpec> {
  type: "file";
  name: string;
  data: T;
  parent: SpecTreeDirectoryNode<T>;
  parentPath: string;
}

export type SpecTreeNode<T extends BaseSpec> =
  | SpecTreeFileNode<T>
  | SpecTreeDirectoryNode<T>;

type DirectoryMap<T extends BaseSpec> = Map<string, SpecTreeDirectoryNode<T>>;

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

type BaseSpec = { relative: string };

export function filterFileNodes<T extends BaseSpec>(
  node: SpecTreeNode<T>
): node is SpecTreeFileNode<T> {
  return node.type === "file";
}

export function filterDirectoryNodes<T extends BaseSpec>(
  node: SpecTreeNode<T>
): node is SpecTreeDirectoryNode<T> {
  return node.type === "directory";
}

export function basicSearch<T extends BaseSpec>(
  search: string,
  specs: T[]
): T[] {
  return specs.filter((x) => x.relative.includes(search));
}

export function fuzzySortSpecs<T extends BaseSpec>(
  search: string,
  specs: T[]
): T[] {
  const fuzzySortResult = fuzzysort
    .go(search, specs, {
      keys: ["relative", "baseName"],
      allowTypo: false,
      threshold: -3000,
    })
    .map((result) => {
      const [relative, baseName] = result;

      return {
        ...result.obj,
        fuzzyIndexes: {
          relative: relative?.indexes ?? [],
          baseName: baseName?.indexes ?? [],
        },
      };
    });

  return fuzzySortResult;
}

function getParentPath(path: string, candidates: string[]) {
  return candidates.reduce<string>((acc, curr) => {
    if (
      path.includes(curr) &&
      path.indexOf(curr) === 0 &&
      curr.length > acc.length
    ) {
      return curr;
    }
    return acc;
  }, candidates[0]);
}

export function deriveSpecTree<T extends BaseSpec>(
  allSpecs: T[],
  options?: Partial<SpecListOptions<T>>
): {
  root: SpecTreeDirectoryNode<T>;
  map: DirectoryMap<T>;
} {
  const sep = options?.sep ?? "/";
  const search = options?.search ?? null;
  const searchFn = options?.searchFn ?? basicSearch;

  let specs = search ? searchFn(search, allSpecs) : allSpecs;

  specs.sort((x, y) => {
    const a = x.relative.split(sep).length;
    const b = y.relative.split(sep).length;
    return a > b ? 1 : -1;
  });

  const root: SpecTreeDirectoryNode<T> = {
    type: "directory",
    relative: "/",
    name: "/",
    parent: null,
    parentPath: null,
    depth: 0,
    collapsed: options?.collapsedDirs?.has("/") ?? false,
    children: [],
  };

  const map: DirectoryMap<T> = new Map([["/", root]]);

  // Get all directories that contain a spec as the immediate child.
  // Eg given:
  // foo/1.ts
  // foo/bar/qux/2.ts
  // The directories are:
  // - foo
  //    - 1.ts
  // - foo/bar/qux (parent is foo)
  //    - 2.ts
  // This is because in the UI, we do **not** show empty directories. We flatten them.
  for (const spec of specs) {
    const { path } = splitIntoParts(spec.relative, sep);

    if (map.get(path)) {
      continue;
    }

    const parentPath = getParentPath(path, Array.from(map.keys()));
    const parentNode = map.get(parentPath);

    if (!parentNode) {
      throw Error(
        `Could not find node with id ${parentPath} in map. Should be impossible.`
      );
    }

    const newDirName =
      parentPath === "/" ? path : path.slice(parentPath.length + sep.length);

    const node: SpecTreeDirectoryNode<T> = {
      type: "directory",
      name: newDirName,
      relative: path,
      parent: parentNode,
      parentPath,
      depth: parentNode.depth + 1,
      children: [],
      collapsed: options?.collapsedDirs?.has(path) ?? false,
    };
    parentNode.children.push(node);
    map.set(path, node);
  }

  // Now we know all the directories and their parent,
  // place each spec in the correct directory.
  for (const spec of specs) {
    const { path, name } = splitIntoParts(spec.relative, sep);
    const parent = map.get(path);

    if (!parent) {
      throw Error(
        `Could not find node with id ${path} in map. Should be impossible.`
      );
    }

    const fileNode: SpecTreeFileNode<T> = {
      name,
      parentPath: path,
      parent,
      type: "file",
      data: spec,
    };

    parent.children.push(fileNode);
  }

  return {
    root,
    map,
  };
}

interface GroupedNodes<T extends { relative: string }> {
  files: SpecTreeFileNode<T>[];
  directories: SpecTreeDirectoryNode<T>[];
}

export function groupSpecTreeNodes<T extends BaseSpec>(
  node: SpecTreeDirectoryNode<T>
): GroupedNodes<T> {
  return node.children.reduce<GroupedNodes<T>>(
    (acc, curr) => {
      if (curr.type === "file") {
        acc.files.push(curr);
      } else {
        acc.directories.push(curr);
      }
      return acc;
    },
    {
      files: [],
      directories: [],
    }
  );
}

export function getAllFileInDirectory<T extends BaseSpec>(
  node: SpecTreeDirectoryNode<T>,
  { depth }: { depth: number } = { depth: 9999 }
): SpecTreeFileNode<T>[] {
  const files: SpecTreeFileNode<T>[] = [];

  function walk(node: SpecTreeNode<T>) {
    if (node.type === "file") {
      files.push(node);
    } else {
      Array.from(node.children.values()).map((n) => walk(n));
    }
  }

  walk(node);

  return files.filter(
    (x) => x.parent.depth >= node.depth && x.parent.depth < node.depth + depth
  );
}
