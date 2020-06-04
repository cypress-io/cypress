/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
require("../spec_helper");

const api    = require(`${root}lib/api`);
const cache  = require(`${root}lib/cache`);
const user   = require(`${root}lib/user`);
const errors = require(`${root}lib/errors`);

describe("lib/user", function() {
  context(".get", () => it("calls cache.getUser", function() {
    sinon.stub(cache, "getUser").resolves({name: "brian"});

    return user.get().then(user => expect(user).to.deep.eq({name: "brian"}));
  }));

  context(".logOut", function() {
    it("calls api.postLogout + removes the session from cache", function() {
      sinon.stub(api, "postLogout").withArgs("abc-123").resolves();
      sinon.stub(cache, "getUser").resolves({name: "brian", authToken: "abc-123"});
      sinon.spy(cache, "removeUser");

      return user.logOut().then(() => expect(cache.removeUser).to.be.calledOnce);
    });

    it("does not send to api.postLogout without a authToken", function() {
      sinon.spy(api, "postLogout");
      sinon.stub(cache, "getUser").resolves({name: "brian"});
      sinon.spy(cache, "removeUser");

      return user.logOut().then(function() {
        expect(api.postLogout).not.to.be.called;
        return expect(cache.removeUser).to.be.calledOnce;
      });
    });

    return it("removes the session from cache even if api.postLogout rejects", function() {
      sinon.stub(api, "postLogout").withArgs("abc-123").rejects(new Error("ECONNREFUSED"));
      sinon.stub(cache, "getUser").resolves({name: "brian", authToken: "abc-123"});
      sinon.spy(cache, "removeUser");

      return user.logOut().catch(() => expect(cache.removeUser).to.be.calledOnce);
    });
  });

  context(".syncProfile", () => it("calls api.getMe then saves user to cache", function() {
    sinon.stub(api, "getMe").resolves({
      name: 'foo',
      email: 'bar@baz'
    });
    sinon.stub(cache, "setUser").resolves();

    return user.syncProfile("foo-123", "bar-456")
    .then(function() {
      expect(api.getMe).to.be.calledWith("foo-123");
      return expect(cache.setUser).to.be.calledWith({
        authToken: "foo-123",
        name: "foo",
        email: "bar@baz"
      });
    });
  }));

  context(".getBaseLoginUrl", () => it("calls api.getAuthUrls", function() {
    sinon.stub(api, "getAuthUrls").resolves({
      "dashboardAuthUrl": "https://github.com/login"
    });

    return user.getBaseLoginUrl().then(url => expect(url).to.eq("https://github.com/login"));
  }));

  return context(".ensureAuthToken", function() {
    it("returns authToken", function() {
      sinon.stub(cache, "getUser").resolves({name: "brian", authToken: "abc-123"});

      return user.ensureAuthToken().then(st => expect(st).to.eq("abc-123"));
    });

    return it("throws NOT_LOGGED_IN when no authToken, tagged as api error", function() {
      sinon.stub(cache, "getUser").resolves(null);

      return user.ensureAuthToken()
      .then(function() {
        throw new Error("should have thrown an error");}).catch(function(err) {
        const expectedErr = errors.get("NOT_LOGGED_IN");
        expect(err.message).to.eq(expectedErr.message);
        expect(err.isApiError).to.be.true;
        return expect(err.type).to.eq(expectedErr.type);
      });
    });
  });
});
