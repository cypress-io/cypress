"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSpecUrl = void 0;
const tslib_1 = require("tslib");
const debug_1 = tslib_1.__importDefault(require("debug"));
const path_1 = tslib_1.__importDefault(require("path"));
const escape_filename_1 = require("./util/escape_filename");
const debug = (0, debug_1.default)('cypress:server:project_utils');
// format is: http://localhost:<port>/__/#/specs/runner?file=<relative_url>
const getSpecUrl = ({ spec, browserUrl, projectRoot, }) => {
    browserUrl !== null && browserUrl !== void 0 ? browserUrl : (browserUrl = '');
    // App routes to spec with convention {browserUrl}#/specs/runner?file={relativeSpecPath}
    if (!spec.absolute) {
        debug('no spec absolute path, returning: %s', browserUrl);
        return browserUrl;
    }
    const relativeSpecPath = path_1.default.relative(projectRoot, path_1.default.resolve(projectRoot, spec.relative));
    const escapedRelativePath = (0, escape_filename_1.escapeFilenameInUrl)(relativeSpecPath);
    const specUrl = `${browserUrl}#/specs/runner?file=${escapedRelativePath}`;
    debug('returning spec url %s', specUrl);
    return specUrl;
};
exports.getSpecUrl = getSpecUrl;
