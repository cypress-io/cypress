require("../spec_helper")

_ = require("lodash")

parent = require("#{root}timers/parent")

describe "timers/parent", ->
  context ".fix", ->
    beforeEach ->
      parent.restore()
      @timer = parent.fix()

    describe "setTimeout", ->
      it "returns timer object", (done) ->
        obj = setTimeout(done, 10)

        expect(obj.id).to.eq(1)
        expect(obj.ref).to.be.a("function")
        expect(obj.unref).to.be.a("function")

      it "increments timer id", (done) ->
        fn = _.after(2, done)

        obj1 = setTimeout(fn, 10)
        obj2 = setTimeout(fn, 10)

        expect(obj2.id).to.eq(2)

      it "slices out of queue once cb is invoked", (done) ->
        fn = =>
          expect(@timer.queue).to.deep.eq({})
          done()

        setTimeout(fn, 10)

        expect(@timer.queue[1].cb).to.eq(fn)

    describe "clearTimeout", ->
      it "does not explode when passing null", ->
        clearTimeout(null)

      it "can clear the timeout and prevent the cb from being invoked", (done) ->
        fn = =>
          done(new Error("should not have been invoked"))

        timer = setTimeout(fn, 10)

        expect(@timer.queue[1].cb).to.eq(fn)

        clearTimeout(timer)

        expect(@timer.queue).to.deep.eq({})

        setTimeout ->
          done()
        , 20

    describe "setInterval", ->
      it "returns timer object", (done) ->
        obj = setInterval ->
          clearInterval(obj)

          done()
        , 10

        expect(obj.id).to.eq(1)
        expect(obj.ref).to.be.a("function")
        expect(obj.unref).to.be.a("function")

      it "increments timer id", (done) ->
        fn = _.after 2, ->
          clearInterval(obj1)
          clearInterval(obj2)
          done()

        obj1 = setInterval(fn, 10)
        obj2 = setInterval(fn, 10000)

        expect(obj2.id).to.eq(2)

      it "continuously polls until cleared", (done) ->
        poller = _.after 3, =>
          clearInterval(t)

          setTimeout ->
            expect(fn).to.be.calledThrice
            done()
          , 100

        fn = sinon.spy(poller)

        t = setInterval(fn, 10)

    describe "clearInterval", ->
      it "does not explode when passing null", ->
        clearInterval(null)

      it "can clear the interval and prevent the cb from being invoked", (done) ->
        fn = =>
          done(new Error("should not have been invoked"))

        timer = setInterval(fn, 10)

        expect(@timer.queue[1].cb).to.exist

        clearInterval(timer)

        expect(@timer.queue).to.deep.eq({})

        setTimeout ->
          done()
        , 20
