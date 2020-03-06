/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const $errUtils = require("../../../../src/cypress/error_utils");
const $errorMessages = require("../../../../src/cypress/error_messages");

describe("driver/src/cypress/error_utils", function() {
  context(".throwErr", () => it("throws the error as sent", function() {
    try {
      return $errUtils.throwErr("Something unexpected");
    } catch (e) {
      expect(e.message).to.include("Something unexpected");
      return expect(e.name).to.eq("CypressError");
    }
  }));

  context(".throwErrByPath", function() {
    beforeEach(() => $errorMessages.__test_errors = {
      obj: {
        message: "This is a simple error message",
        docsUrl: "https://on.link.io"
      },
      obj_with_args: {
        message: "This has args like '{{foo}}' and {{bar}}",
        docsUrl: "https://on.link.io"
      },
      obj_with_multi_args: {
        message: "This has args like '{{foo}}' and {{bar}}, and '{{foo}}' is used twice",
        docsUrl: "https://on.link.io"
      },
      obj_with_markdown: {
        message: "This has markdown like `{{foo}}`, *{{bar}}*, **{{foo}}**, and _{{bar}}_",
        docsUrl: "https://on.link.io"
      },
      str: "This is a simple error message",
      str_with_args: "This has args like '{{foo}}' and {{bar}}",
      str_with_multi_args: "This has args like '{{foo}}' and {{bar}}, and '{{foo}}' is used twice",
      str_with_markdown: "This has markdown like `{{foo}}`, *{{bar}}*, **{{foo}}**, and _{{bar}}_",
      fn() {
        return `\
This is a simple error message\
`;
      },
      fn_with_args(obj) {
        return `\
This has args like '${obj.foo}' and ${obj.bar}\
`;
      },
      fn_with_multi_args(obj) {
        return `\
This has args like '${obj.foo}' and ${obj.bar}, and '${obj.foo}' is used twice\
`;
      },
      fn_with_markdown(obj) {
        return `\
This has markdown like \`${obj.foo}\`, *${obj.bar}*, **${obj.foo}**, and _${obj.bar}_\
`;
      },
      fn_returns_obj: () => ({
        message: `\
This is a simple error message\
`,
        docsUrl: "https://on.link.io"
      }),
      fn_returns_obj_with_args: obj => ({
        message: `\
This has args like '${obj.foo}' and ${obj.bar}\
`,
        docsUrl: "https://on.link.io"
      }),
      fn_returns_obj_with_multi_args: obj => ({
        message: `\
This has args like '${obj.foo}' and ${obj.bar}, and '${obj.foo}' is used twice\
`,
        docsUrl: "https://on.link.io"
      }),
      fn_returns_obj_with_markdown: obj => ({
        message: `\
This has markdown like \`${obj.foo}\`, *${obj.bar}*, **${obj.foo}**, and _${obj.bar}_\
`,
        docsUrl: "https://on.link.io"
      })
    });

    describe("when error message path does not exist", function() {
      it("has an err.name of InternalError", function() {
        try {
          return $errUtils.throwErrByPath("not.there");
        } catch (e) {
          return expect(e.name).to.eq("InternalError");
        }
      });

      return it("has the right message", function() {
        try {
          return $errUtils.throwErrByPath("not.there");
        } catch (e) {
          return expect(e.message).to.include("Error message path 'not.there' does not exist");
        }
      });
    });

    describe("when error message path exists", function() {
      context("error is string", function() {
        describe("when no args are provided for the error", function() {
          it("has an err.name of CypressError", function() {
            try {
              return $errUtils.throwErrByPath("__test_errors.str");
            } catch (e) {
              return expect(e.name).to.eq("CypressError");
            }
          });

          return it("has the right message and docs url", function() {
            try {
              return $errUtils.throwErrByPath("__test_errors.str");
            } catch (e) {
              return expect(e.message).to.include("This is a simple error message");
            }
          });
        });

        describe("when args are provided for the error", () => it("uses them in the error message", function() {
          try {
            return $errUtils.throwErrByPath("__test_errors.str_with_args", {
              args: {
                foo: "foo", bar: ["bar", "qux"]
              }
            });
          } catch (e) {
            return expect(e.message).to.include("This has args like 'foo' and bar,qux");
          }
        }));

        describe("when args are provided for the error and some are used multiple times in message", () => it("uses them in the error message", function() {
          try {
            return $errUtils.throwErrByPath("__test_errors.str_with_multi_args", {
              args: {
                foo: "foo", bar: ["bar", "qux"]
              }
            });
          } catch (e) {
            return expect(e.message).to.include("This has args like 'foo' and bar,qux, and 'foo' is used twice");
          }
        }));

        return describe("when markdown and args", () => it("formats markdown in the error message", function() {
          try {
            return $errUtils.throwErrByPath("__test_errors.str_with_markdown", {
              args: {
                foo: "foo", bar: ["bar", "qux"]
              }
            });
          } catch (e) {
            return expect(e.message).to.include("This has markdown like `foo`, *bar,qux*, **foo**, and _bar,qux_");
          }
        }));
      });

      return context("error is function that returns a string", function() {
        describe("when no args are provided for the error", function() {
          it("has an err.name of CypressError", function() {
            try {
              return $errUtils.throwErrByPath("__test_errors.fn");
            } catch (e) {
              return expect(e.name).to.eq("CypressError");
            }
          });

          return it("has the right message and docs url", function() {
            try {
              return $errUtils.throwErrByPath("__test_errors.fn");
            } catch (e) {
              return expect(e.message).to.include("This is a simple error message");
            }
          });
        });

        describe("when args are provided for the error", () => it("uses them in the error message", function() {
          try {
            return $errUtils.throwErrByPath("__test_errors.fn_with_args", {
              args: {
                foo: "foo", bar: ["bar", "qux"]
              }
            });
          } catch (e) {
            return expect(e.message).to.include("This has args like 'foo' and bar,qux");
          }
        }));

        describe("when args are provided for the error and some are used multiple times in message", () => it("uses them in the error message", function() {
          try {
            return $errUtils.throwErrByPath("__test_errors.fn_with_multi_args", {
              args: {
                foo: "foo", bar: ["bar", "qux"]
              }
            });
          } catch (e) {
            return expect(e.message).to.include("This has args like 'foo' and bar,qux, and 'foo' is used twice");
          }
        }));

        return describe("when markdown and args", () => it("formats markdown in the error message", function() {
          try {
            return $errUtils.throwErrByPath("__test_errors.fn_with_markdown", {
              args: {
                foo: "foo", bar: ["bar", "qux"]
              }
            });
          } catch (e) {
            return expect(e.message).to.include("This has markdown like `foo`, *bar,qux*, **foo**, and _bar,qux_");
          }
        }));
      });
    });

    describe("when onFail is provided as a function", () => it("attaches the function to the error", function() {
      const onFail = function() {};
      try {
        return $errUtils.throwErrByPath("__test_errors.obj", { onFail });
      } catch (e) {
        return expect(e.onFail).to.equal(onFail);
      }
    }));

    return describe("when onFail is provided as a command", () => it("attaches the handler to the error", function() {
      const command = { error: cy.spy() };
      try {
        return $errUtils.throwErrByPath("__test_errors.obj", { onFail: command });
      } catch (e) {
        e.onFail("the error");
        return expect(command.error).to.be.calledWith("the error");
      }
    }));
  });

  return context(".getObjValueByPath", function() {
    beforeEach(function() {
      return this.obj = {
        foo: "foo",
        bar: {
          baz: {
            qux: "qux"
          }
        }
      };
    });

    it("throws if object not provided as first argument", function() {
      const fn = () => $errUtils.getObjValueByPath("foo");

      return expect(fn).to.throw("The first parameter to utils.getObjValueByPath() must be an object");
    });

    it("throws if path not provided as second argument", function() {
      const fn = () => {
        return $errUtils.getObjValueByPath(this.obj);
      };

      return expect(fn).to.throw("The second parameter to utils.getObjValueByPath() must be a string");
    });

    it("returns value for shallow path", function() {
      const objVal = $errUtils.getObjValueByPath(this.obj, "foo");
      return expect(objVal).to.equal("foo");
    });

    it("returns value for deeper path", function() {
      const objVal = $errUtils.getObjValueByPath(this.obj, "bar.baz.qux");
      return expect(objVal).to.equal("qux");
    });

    it("returns undefined for non-existent shallow path", function() {
      const objVal = $errUtils.getObjValueByPath(this.obj, "nope");
      return expect(objVal).to.be.undefined;
    });

    return it("returns undefined for non-existent deeper path", function() {
      const objVal = $errUtils.getObjValueByPath(this.obj, "bar.baz.nope");
      return expect(objVal).to.be.undefined;
    });
  });
});
