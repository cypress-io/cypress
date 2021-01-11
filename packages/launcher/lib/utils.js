"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const execa_1 = __importDefault(require("execa"));
const child_process_1 = __importDefault(require("child_process"));
const bluebird_1 = __importDefault(require("bluebird"));
// export an object for easy method stubbing
exports.utils = {
    execa: execa_1.default,
    getOutput: (cmd, args) => {
        if (process.platform === 'win32') {
            // execa has better support for windows spawning conventions
            throw new Error('getOutput should not be used on Windows - use execa instead');
        }
        return new bluebird_1.default((resolve, reject) => {
            let stdout = '';
            let stderr = '';
            const proc = child_process_1.default.spawn(cmd, args);
            const finish = () => {
                proc.kill();
                resolve({ stderr, stdout });
            };
            proc.on('exit', finish);
            proc.stdout.on('data', (chunk) => {
                stdout += chunk;
            });
            proc.stderr.on('data', (chunk) => {
                stderr += chunk;
            });
            proc.on('error', (err) => {
                proc.kill();
                reject(err);
            });
        });
    },
};
