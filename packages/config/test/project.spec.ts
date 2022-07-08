describe('config/src/project', () => {
  context('.parseEnv', () => {
    it('merges together env from config, env from file, env from process, and env from CLI', () => {
      sinon.stub(configUtil, 'getProcessEnvVars').returns({
        version: '0.12.1',
        user: 'bob',
      })

      const obj = {
        env: {
          version: '0.10.9',
          project: 'todos',
          host: 'localhost',
          baz: 'quux',
        },

        envFile: {
          host: 'http://localhost:8888',
          user: 'brian',
          foo: 'bar',
        },
      }

      const envCLI = {
        version: '0.14.0',
        project: 'pie',
      }

      expect(config.parseEnv(obj, envCLI)).to.deep.eq({
        version: '0.14.0',
        project: 'pie',
        host: 'http://localhost:8888',
        user: 'bob',
        foo: 'bar',
        baz: 'quux',
      })
    })
  })
})
