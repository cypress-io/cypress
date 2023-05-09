"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Screenshot = void 0;
const tslib_1 = require("tslib");
const screenshots_1 = tslib_1.__importDefault(require("../screenshots"));
function Screenshot(screenshotsFolder) {
    return {
        capture(data, automate) {
            return screenshots_1.default.capture(data, automate)
                .then((details) => {
                // if there are no details, this is part of a multipart screenshot
                // and should not be saved
                if (!details) {
                    return;
                }
                return screenshots_1.default.save(data, details, screenshotsFolder)
                    .then((savedDetails) => {
                    return screenshots_1.default.afterScreenshot(data, savedDetails);
                });
            }).catch((err) => {
                screenshots_1.default.clearMultipartState();
                throw err;
            });
        },
    };
}
exports.Screenshot = Screenshot;
