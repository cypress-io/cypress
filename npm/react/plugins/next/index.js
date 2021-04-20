const next = require("next");
const { createServer } = require("http");
const path = require("path");
const fs = require("fs");

const makeReloader = (testDir, supportFile, specFile) => {
  const supportFileImport = supportFile
    ? `()=>import(${JSON.stringify(
        path.join("..", "projectRoot", supportFile)
      )})`
    : `()=>Promise.resolve()`;
  const specFileImport = specFile
    ? `()=>import(${JSON.stringify(path.join("..", "projectRoot", specFile))})`
    : `()=>Promise.resolve()`;
  const fileContent = `
        import React from 'react'
        export default function ReLoader(){
        React.useEffect(()=>{
            const Cypress = window.Cypress = (window.opener || window.parent).Cypress
            if (!Cypress) {
            throw new Error('Tests cannot run without a reference to Cypress!')
            }
            Cypress.onSpecWindow(window,[
                ${supportFileImport},
                ${specFileImport}
                ] )
            Cypress.action('app:window:before:load', window)
        },[])
        return null
        }`;
  fs.writeFileSync(
    path.join(testDir, "components", "testloader.js"),
    fileContent
  );
};
module.exports = function (on, config) {
  on("dev-server:start", async (options) => {
    const testDir = path.join(options.config.projectRoot, ".next", ".cypress");
    await fs.promises.rmdir(testDir, { recursive: true });
    await fs.promises.mkdir(path.join(testDir, "pages"), { recursive: true });
    await fs.promises.mkdir(path.join(testDir, "components"));
    await fs.promises.symlink(
      options.config.projectRoot,
      path.join(testDir, "projectRoot"),
      "junction"
    );
    const supportFile = path.relative(
      options.config.projectRoot,
      options.config.supportFile
    );
    const nextConfig = {
      webpack(config) {
        return config;
      },
    };
    try {
      Object.assign(
        nextConfig,
        require(path.join(config.projectRoot, "next.config.js"))
      );
    } catch {
      console.log("no next.config.js found,using default");
    }
    const originalConfigFn = nextConfig.webpack;
    nextConfig.webpack = (config, options) => {
      const newConfig = originalConfigFn(config, options);
      newConfig.resolve.symlinks = false; //otherwise spec files are not transpiled as symlink resolves outside projectRoot
      return newConfig;
    };
    makeReloader(testDir, supportFile);
    await fs.promises.writeFile(
      path.join(testDir, "pages", "[[...catchall]].js"),
      `
        import React from 'react'
            import TestLoader from '../components/testloader'
            export default function App(){
                return <>
                    <div id="__cy_root"></div>
                    <TestLoader/>
                </>
                }`
    );
    const app = next({
      dev: true,
      dir: testDir,
      conf: nextConfig,
    });
    await app.prepare();
    const handler = app.getRequestHandler();
    let specPath = null;
    // ideally would ouput a file similar to https://github.com/cypress-io/cypress/blob/develop/npm/webpack-dev-server/src/loader.ts
    // but for some reason options.specs always seems to be an empty array so use this hack instead

    const server = createServer((req, res) => {
      if (
        req.headers.__cypress_spec_path &&
        specPath != req.headers.__cypress_spec_path
      ) {
        specPath = req.headers.__cypress_spec_path;
        makeReloader(testDir, supportFile, specPath);
      }

      handler(req, res);
    });
    options.devServerEvents.on("dev-server:specs:changed", (specs) => {
      //regenerate specs file if can get to work as planned (see comment above)
      console.log(specs);
    });
    return new Promise((res, rej) => {
      server.listen(0, "127.0.0.1", (err) => {
        if (err) rej();
        console.log(`listening on ${server.address().port}`);
        res({
          port: server.address().port,
          close: (done) => {
            console.log("shutting down next app");
            app.close().then(() => {
              console.log("shutting down devserver");
              server.close(() => {
                done && done();
              });
            });
          },
        });
      });
    });
  });
};

