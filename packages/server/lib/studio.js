"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCommandsText = exports.save = exports.getStudioModalShown = void 0;
const tslib_1 = require("tslib");
const savedState = tslib_1.__importStar(require("./saved_state"));
const spec_writer_1 = require("./util/spec_writer");
class StudioSaveError extends Error {
    constructor(isSuite) {
        super(StudioSaveError.errMessage(isSuite));
        this.name = 'StudioSaveError';
    }
}
StudioSaveError.errMessage = (isSuite) => `Studio was unable to find your ${isSuite ? 'suite' : 'test'} in the spec file.`;
const getStudioModalShown = () => {
    return savedState.create()
        .then((state) => state.get())
        .then((state) => !!state.showedStudioModal);
};
exports.getStudioModalShown = getStudioModalShown;
const save = (saveInfo) => {
    const { isSuite, isRoot, absoluteFile, commands, testName } = saveInfo;
    const saveToFile = () => {
        if (isRoot) {
            return (0, spec_writer_1.createNewTestInFile)(absoluteFile, commands, testName || 'New Test');
        }
        if (isSuite) {
            return (0, spec_writer_1.createNewTestInSuite)(saveInfo);
        }
        return (0, spec_writer_1.appendCommandsToTest)(saveInfo);
    };
    return saveToFile()
        .then((success) => {
        if (!success) {
            throw new StudioSaveError(isSuite);
        }
        return null;
    })
        .catch((err) => {
        return {
            type: err.type,
            name: err.name,
            message: err.message,
            stack: err.stack,
        };
    });
};
exports.save = save;
const getCommandsText = (commands) => {
    return (0, spec_writer_1.convertCommandsToText)(commands);
};
exports.getCommandsText = getCommandsText;
