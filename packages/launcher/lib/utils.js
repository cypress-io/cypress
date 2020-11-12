"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var execa_1 = __importDefault(require("execa"));
var child_process_1 = __importDefault(require("child_process"));
var bluebird_1 = __importDefault(require("bluebird"));
// export an object for easy method stubbing
exports.utils = {
    execa: execa_1.default,
    getOutput: function (cmd, args) {
        if (process.platform === 'win32') {
            // execa has better support for windows spawning conventions
            throw new Error('getOutput should not be used on Windows - use execa instead');
        }
        return new bluebird_1.default(function (resolve, reject) {
            var stdout = '';
            var stderr = '';
            var proc = child_process_1.default.spawn(cmd, args);
            var finish = function () {
                proc.kill();
                resolve({ stderr: stderr, stdout: stdout });
            };
            proc.on('exit', finish);
            proc.stdout.on('data', function (chunk) {
                stdout += chunk;
            });
            proc.stderr.on('data', function (chunk) {
                stderr += chunk;
            });
            proc.on('error', function (err) {
                proc.kill();
                reject(err);
            });
        });
    },
};
