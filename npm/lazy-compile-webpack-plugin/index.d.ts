import { Compiler, Compilation } from "webpack";

declare class LazyCompilePlugin {
    constructor(options?: LazyCompilePlugin.Options);
    apply(compiler: Compiler): void;
}

declare namespace LazyCompilePlugin {
    interface Options {
        refreshAfterCompile: boolean
        ignores: RegExp[] | Function[]
    }   
}

export = LazyCompilePlugin
  