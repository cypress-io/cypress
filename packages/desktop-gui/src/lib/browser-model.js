import { observable, makeObservable } from 'mobx'

export default class Browser {
  displayName;
  name;
  family;
  channel;
  version;
  path;
  profilePath;
  majorVersion;
  info;
  custom;
  warning;
  isChosen = false;

  constructor (browser) {
    makeObservable(this, {
      displayName: observable,
      name: observable,
      family: observable,
      channel: observable,
      version: observable,
      path: observable,
      profilePath: observable,
      majorVersion: observable,
      info: observable,
      custom: observable,
      warning: observable,
      isChosen: observable,
    })

    this.displayName = browser.displayName
    this.name = browser.name
    this.family = browser.family
    this.channel = browser.channel
    this.version = browser.version
    this.path = browser.path
    this.profilePath = browser.profilePath
    this.majorVersion = browser.majorVersion
    this.info = browser.info
    this.custom = browser.custom
    this.warning = browser.warning
  }
}
