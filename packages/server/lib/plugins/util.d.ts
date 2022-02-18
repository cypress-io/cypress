import type { ChildProcess } from "child_process";

export declare const wrapIpc: (aProcess:ChildProcess) => {
  send: (event: string, ...args:any[]) => void;
  on: (event: string, listener:(data:any) => void) => void;
  removeListener: (event:string, listener:(data:any) => void) => void;
};