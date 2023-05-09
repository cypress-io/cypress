"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.countStudioUsage = exports.createFile = exports.createNewTestInFile = exports.createNewTestInSuite = exports.appendCommandsToTest = exports.convertCommandsToText = exports.addCommandsToBody = exports.addCommentToBody = exports.generateTest = exports.generateCypressCommand = void 0;
const tslib_1 = require("tslib");
const fs_1 = require("./fs");
const ast_types_1 = require("ast-types");
const recast = tslib_1.__importStar(require("recast"));
const parser_1 = require("@babel/parser");
const path_1 = tslib_1.__importDefault(require("path"));
const newFileTemplate = (file) => {
    return `// ${path_1.default.basename(file)} created with Cypress
//
// Start writing your Cypress tests below!
// If you're unfamiliar with how Cypress works,
// check out the link below and learn how to write your first test:
// https://on.cypress.io/writing-first-test
`;
};
const printSettings = {
    quote: 'single',
    wrapColumn: 360,
};
const generateCommentText = (comment) => ` ==== ${comment} ==== `;
const createdComment = generateCommentText('Test Created with Cypress Studio');
const extendedStartComment = generateCommentText('Generated with Cypress Studio');
const extendedEndComment = generateCommentText('End Cypress Studio');
const generateCypressCommand = (cmd) => {
    const { selector, name, message, isAssertion } = cmd;
    let messageExpression = null;
    if (isAssertion && Array.isArray(message)) {
        messageExpression = message.map(ast_types_1.builders.stringLiteral);
    }
    else if (Array.isArray(message)) {
        messageExpression = [ast_types_1.builders.arrayExpression(message.map(ast_types_1.builders.stringLiteral))];
    }
    else if (message) {
        messageExpression = [ast_types_1.builders.stringLiteral(message)];
    }
    let stmt;
    if (selector) {
        // generates a statement in the form of cy.get(selector).name(message)
        // ex. cy.get('.btn').click() or cy.get('.input').type('words')
        stmt = ast_types_1.builders.expressionStatement(ast_types_1.builders.callExpression(ast_types_1.builders.memberExpression(ast_types_1.builders.callExpression(ast_types_1.builders.memberExpression(ast_types_1.builders.identifier('cy'), ast_types_1.builders.identifier('get'), false), [ast_types_1.builders.stringLiteral(selector)]), ast_types_1.builders.identifier(name)), messageExpression || []));
    }
    else {
        // generates a statement in the form of cy.name(message)
        // ex. cy.visit('https://example.cypress.io')
        stmt = ast_types_1.builders.expressionStatement(ast_types_1.builders.callExpression(ast_types_1.builders.memberExpression(ast_types_1.builders.identifier('cy'), ast_types_1.builders.identifier(name), false), messageExpression || []));
    }
    // for some reason in certain files no comments will show up at all without this
    // even if they're attached to different commands
    stmt.comments = [];
    return stmt;
};
exports.generateCypressCommand = generateCypressCommand;
const generateTest = (name, body) => {
    // creates an `it` statement with name and given body
    // it('name', function () { body })
    const stmt = ast_types_1.builders.expressionStatement(ast_types_1.builders.callExpression(ast_types_1.builders.identifier('it'), [
        ast_types_1.builders.stringLiteral(name),
        ast_types_1.builders.functionExpression(null, [], body),
    ]));
    // adding the comment like this also adds a newline before the comment
    stmt.comments = [ast_types_1.builders.block(createdComment, true, false)];
    return stmt;
};
exports.generateTest = generateTest;
const addCommentToBody = (body, comment) => {
    const block = ast_types_1.builders.block(comment, false, true);
    const stmt = ast_types_1.builders.emptyStatement();
    stmt.comments = [block];
    body.push(stmt);
    return body;
};
exports.addCommentToBody = addCommentToBody;
const addCommandsToBody = (body, commands) => {
    (0, exports.addCommentToBody)(body, extendedStartComment);
    commands.forEach((command) => {
        body.push((0, exports.generateCypressCommand)(command));
    });
    (0, exports.addCommentToBody)(body, extendedEndComment);
    return body;
};
exports.addCommandsToBody = addCommandsToBody;
const convertCommandsToText = (commands) => {
    const program = ast_types_1.builders.program([]);
    (0, exports.addCommandsToBody)(program.body, commands);
    const { code } = recast.print(program, printSettings);
    return code;
};
exports.convertCommandsToText = convertCommandsToText;
const getIdentifier = (node) => {
    const { callee } = node;
    if (callee.type === 'Identifier') {
        return callee;
    }
    // .only forms a member expression
    // with the first part (`object`) being the identifier of interest
    if (callee.type === 'MemberExpression') {
        return callee.object;
    }
    return;
};
const getFunctionFromExpression = (node) => {
    const arg1 = node.arguments[1];
    // if the second argument is an object we have a test/suite configuration
    if (arg1.type === 'ObjectExpression') {
        return node.arguments[2];
    }
    return arg1;
};
// try to find the runnable based off line and column number
const generateFileDetailsAstRules = (fileDetails, fnNames, cb) => {
    const { line, column } = fileDetails;
    return {
        visitCallExpression(path) {
            const { node } = path;
            const identifier = getIdentifier(node);
            if (identifier && identifier.loc) {
                const columnStart = identifier.loc.start.column + 1;
                const columnEnd = identifier.loc.end.column + 2;
                if (fnNames.includes(identifier.name) && identifier.loc.start.line === line && columnStart <= column && column <= columnEnd) {
                    const fn = getFunctionFromExpression(node);
                    if (!fn) {
                        return this.abort();
                    }
                    cb(fn);
                    return this.abort();
                }
            }
            return this.traverse(path);
        },
    };
};
// try to find the runnable based off title
const generateTestPathAstRules = (runnableTitle, fnNames, cb) => {
    return {
        visitCallExpression(path) {
            const { node } = path;
            const identifier = getIdentifier(node);
            if (identifier && fnNames.includes(identifier.name)) {
                const arg0 = node.arguments[0];
                if (arg0.value === runnableTitle) {
                    const fn = getFunctionFromExpression(node);
                    cb(fn);
                    return false;
                }
            }
            return this.traverse(path);
        },
    };
};
const createTest = ({ body }, commands, testName) => {
    const testBody = ast_types_1.builders.blockStatement([]);
    (0, exports.addCommandsToBody)(testBody.body, commands);
    const test = (0, exports.generateTest)(testName, testBody);
    body.push(test);
    return test;
};
const updateRunnableExpression = async ({ fileDetails, absoluteFile, runnableTitle }, fnNames, cb) => {
    // if we have file details we first try to find the runnable using line and column number
    if (fileDetails && fileDetails.absoluteFile) {
        const fileDetailsAst = await getAst(fileDetails.absoluteFile);
        let fileDetailsSuccess = false;
        const fileDetailsAstRules = generateFileDetailsAstRules(fileDetails, fnNames, (fn) => {
            cb(fn);
            fileDetailsSuccess = true;
        });
        (0, ast_types_1.visit)(fileDetailsAst, fileDetailsAstRules);
        if (fileDetailsSuccess) {
            return writeAst(fileDetails.absoluteFile, fileDetailsAst)
                .then(() => true);
        }
    }
    // if there are no file details or the line/column are incorrect
    // we try to then match by runnable title
    const runnableTitleAst = await getAst(absoluteFile);
    let runnableTitleSuccess = false;
    let runnableTitleFound = false;
    const runnableTitleAstRules = generateTestPathAstRules(runnableTitle, fnNames, (fn) => {
        // if there are two runnables with the same title we can't tell which is the target
        // so we don't save anything
        if (runnableTitleFound) {
            runnableTitleSuccess = false;
        }
        else {
            if (fn) {
                cb(fn);
                runnableTitleSuccess = true;
            }
            runnableTitleFound = true;
        }
    });
    (0, ast_types_1.visit)(runnableTitleAst, runnableTitleAstRules);
    if (runnableTitleSuccess) {
        return writeAst(absoluteFile, runnableTitleAst)
            .then(() => true);
    }
    return Promise.resolve(false);
};
const appendCommandsToTest = async (saveDetails) => {
    const { commands } = saveDetails;
    return updateRunnableExpression(saveDetails, ['it', 'specify'], (fn) => {
        (0, exports.addCommandsToBody)(fn.body.body, commands);
    });
};
exports.appendCommandsToTest = appendCommandsToTest;
const createNewTestInSuite = (saveDetails) => {
    const { commands, testName } = saveDetails;
    return updateRunnableExpression(saveDetails, ['describe', 'context'], (fn) => {
        createTest(fn.body, commands, testName);
    });
};
exports.createNewTestInSuite = createNewTestInSuite;
const createNewTestInFile = (absoluteFile, commands, testName) => {
    let success = false;
    const astRules = {
        visitProgram(path) {
            const { node } = path;
            const { innerComments } = node;
            // needed to preserve any comments in an empty file
            if (innerComments) {
                innerComments.forEach((comment) => comment.leading = true);
            }
            createTest(node, commands, testName);
            success = true;
            return false;
        },
    };
    return getAst(absoluteFile)
        .then((ast) => {
        (0, ast_types_1.visit)(ast, astRules);
        if (success) {
            return writeAst(absoluteFile, ast)
                .then(() => true);
        }
        return Promise.resolve(false);
    });
};
exports.createNewTestInFile = createNewTestInFile;
const getAst = (path) => {
    return fs_1.fs.readFile(path)
        .then((contents) => {
        return recast.parse(contents.toString(), {
            parser: {
                parse(source) {
                    // use babel parser for ts support and more
                    return (0, parser_1.parse)(source, {
                        errorRecovery: true,
                        sourceType: 'unambiguous',
                        plugins: [
                            'typescript',
                        ],
                    });
                },
            },
        });
    });
};
const writeAst = (path, ast) => {
    const { code } = recast.print(ast, printSettings);
    return fs_1.fs.writeFile(path, code);
};
const createFile = (path) => {
    return fs_1.fs.writeFile(path, newFileTemplate(path));
};
exports.createFile = createFile;
// currently un-used post 10.x release
const countStudioUsage = (path) => {
    return fs_1.fs.readFile(path)
        .then((specBuffer) => {
        const specContents = specBuffer.toString();
        const createdRegex = new RegExp(createdComment, 'g');
        const extendedRegex = new RegExp(extendedStartComment, 'g');
        // TODO: remove when Studio goes GA
        // earlier versions of studio used this comment to mark a created test
        // which was later changed to be consistent with other Studio comments
        const oldCreatedRegex = / === Test Created with Cypress Studio === /g;
        const oldStudioCreated = (specContents.match(oldCreatedRegex) || []).length;
        return {
            studioCreated: (specContents.match(createdRegex) || []).length + oldStudioCreated,
            studioExtended: (specContents.match(extendedRegex) || []).length,
        };
    });
};
exports.countStudioUsage = countStudioUsage;
