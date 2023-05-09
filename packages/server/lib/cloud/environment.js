"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const child_process_1 = require("child_process");
const util_1 = require("util");
const base64url_1 = tslib_1.__importDefault(require("base64url"));
const fs_extra_1 = tslib_1.__importDefault(require("fs-extra"));
const resolve_package_path_1 = tslib_1.__importDefault(require("resolve-package-path"));
const execAsync = (0, util_1.promisify)(child_process_1.exec);
// See https://whimsical.com/encryption-logic-BtJJkN7TxacK8kaHDgH1zM for more information on what this is doing
const getProcessBranchForPid = async (pid) => {
    const { stdout } = await execAsync('ps -eo pid=,ppid=');
    const processTree = stdout.split('\n').reduce((acc, line) => {
        const [pid, ppid] = line.trim().split(/\s+/);
        acc.set(pid, ppid);
        return acc;
    }, new Map());
    const currentProcessBranch = [];
    while (pid && pid !== '0') {
        currentProcessBranch.push(pid);
        pid = processTree.get(pid);
    }
    return currentProcessBranch;
};
// See https://whimsical.com/encryption-logic-BtJJkN7TxacK8kaHDgH1zM for more information on what this is doing
const getCypressEnvUrlFromProcessBranch = async (pid) => {
    let error;
    let envUrl;
    if (process.platform !== 'win32') {
        try {
            const processBranch = await getProcessBranchForPid(pid);
            const { stdout } = await execAsync(`ps eww -p ${processBranch.join(',')} -o pid=,command=`);
            const pidEnvUrlMapping = stdout.split('\n').reduce((acc, line) => {
                const cypressEnvUrl = line.trim().match(/(\d+)\s.*CYPRESS_API_URL=(\S+)\s/);
                if (cypressEnvUrl) {
                    acc.set(cypressEnvUrl[1], cypressEnvUrl[2]);
                }
                return acc;
            }, new Map());
            const foundPid = processBranch.find((pid) => pidEnvUrlMapping.get(pid));
            if (foundPid) {
                envUrl = pidEnvUrlMapping.get(foundPid);
            }
        }
        catch (err) {
            error = err;
        }
    }
    return {
        envUrl,
        error,
    };
};
// See https://whimsical.com/encryption-logic-BtJJkN7TxacK8kaHDgH1zM for more information on what this is doing
const getEnvInformationForProjectRoot = async (projectRoot, pid) => {
    let dependencies = {};
    let errors = [];
    let envDependencies = process.env.CYPRESS_ENV_DEPENDENCIES;
    let envUrl = process.env.CYPRESS_API_URL;
    let checkProcessTree;
    if (envDependencies) {
        const envDependenciesInformation = JSON.parse(base64url_1.default.decode(envDependencies));
        const packageToJsonMapping = {};
        const processDependency = ({ checkOnFound }) => {
            return (dependency) => {
                try {
                    const packageJsonPath = (0, resolve_package_path_1.default)(dependency, projectRoot);
                    if (packageJsonPath) {
                        packageToJsonMapping[dependency] = packageJsonPath;
                        checkProcessTree = checkOnFound;
                    }
                }
                catch (error) {
                    errors.push({
                        dependency,
                        name: error.name,
                        message: error.message,
                        stack: error.stack,
                    });
                }
            };
        };
        envDependenciesInformation.maybeCheckProcessTreeIfPresent.forEach(processDependency({ checkOnFound: true }));
        envDependenciesInformation.neverCheckProcessTreeIfPresent.forEach(processDependency({ checkOnFound: false }));
        const [{ envUrl: processTreeEnvUrl, error: processTreeError }] = await Promise.all([
            checkProcessTree ? getCypressEnvUrlFromProcessBranch(pid) : { envUrl: undefined, error: undefined },
            ...Object.entries(packageToJsonMapping).map(async ([dependency, packageJsonPath]) => {
                try {
                    const packageVersion = (await fs_extra_1.default.readJSON(packageJsonPath)).version;
                    dependencies[dependency] = {
                        version: packageVersion,
                    };
                }
                catch (error) {
                    errors.push({
                        dependency,
                        name: error.name,
                        message: error.message,
                        stack: error.stack,
                    });
                }
            }),
        ]);
        if (processTreeEnvUrl || processTreeError) {
            envUrl = processTreeEnvUrl;
            if (processTreeError) {
                errors.push(processTreeError);
            }
        }
    }
    return {
        envUrl,
        errors,
        dependencies,
    };
};
exports.default = getEnvInformationForProjectRoot;
