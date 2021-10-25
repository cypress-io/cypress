/* eslint-disable */
export type Maybe<T> = T | null;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
/** All built-in and custom scalars, mapped to their actual values */
export interface Scalars {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  /** A date string, such as 2007-12-03, compliant with the `full-date` format outlined in section 5.6 of the RFC 3339 profile of the ISO 8601 standard for representation of dates and times using the Gregorian calendar. */
  Date: string;
  /** A date-time string at UTC, such as 2007-12-03T10:15:30Z, compliant with the `date-time` format outlined in section 5.6 of the RFC 3339 profile of the ISO 8601 standard for representation of dates and times using the Gregorian calendar. */
  DateTime: string;
  /** The `JSON` scalar type represents JSON values as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf). */
  JSON: any;
}

/** Namespace for information related to the app */
export interface App {
  __typename: 'App';
  /** Active project */
  activeProject?: Maybe<Project>;
  /** The mode the interactive runner was launched in */
  activeTestingType?: Maybe<TestingTypeEnum>;
  /** Browsers found that are compatible with Cypress */
  browsers?: Maybe<Array<Browser>>;
  /** See if the GraphQL server is alive */
  healthCheck: Scalars['String'];
  /** Whether the browser has been opened for auth or not */
  isAuthBrowserOpened: Scalars['Boolean'];
  /** Whether the app is in global mode or not */
  isInGlobalMode: Scalars['Boolean'];
  /** All known projects for the app */
  projects: Array<Project>;
  /** The currently selected browser for the application */
  selectedBrowser?: Maybe<Browser>;
}

/** Base error */
export interface BaseError {
  __typename: 'BaseError';
  message?: Maybe<Scalars['String']>;
  stack?: Maybe<Scalars['String']>;
  title?: Maybe<Scalars['String']>;
}

/** Container representing a browser */
export interface Browser extends Node {
  __typename: 'Browser';
  channel: Scalars['String'];
  disabled: Scalars['Boolean'];
  displayName: Scalars['String'];
  family: BrowserFamily;
  /** Relay style Node ID field for the Browser field */
  id: Scalars['ID'];
  isSelected: Scalars['Boolean'];
  majorVersion?: Maybe<Scalars['String']>;
  name: Scalars['String'];
  path: Scalars['String'];
  version: Scalars['String'];
}

export type BrowserFamily =
  | 'chromium'
  | 'firefox';

/** A CloudOrganization represents an Organization stored in the Cypress Cloud */
export interface CloudOrganization extends Node {
  __typename: 'CloudOrganization';
  /** Globally unique identifier representing a concrete GraphQL ObjectType */
  id: Scalars['ID'];
  /** Name of the organization */
  name?: Maybe<Scalars['String']>;
  /** A connection for cloud projects associated with this organization */
  projects?: Maybe<CloudProjectConnection>;
}


/** A CloudOrganization represents an Organization stored in the Cypress Cloud */
export interface CloudOrganizationProjectsArgs {
  after?: Maybe<Scalars['String']>;
  before?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  last?: Maybe<Scalars['Int']>;
}

/** A Connection adhering to the Relay Specification */
export interface CloudOrganizationConnection {
  __typename: 'CloudOrganizationConnection';
  /** A list of edges. */
  edges: Array<CloudOrganizationEdge>;
  /** A list of nodes. */
  nodes: Array<CloudOrganization>;
  /** PageInfo result for the connection */
  pageInfo: PageInfo;
}

export interface CloudOrganizationEdge {
  __typename: 'CloudOrganizationEdge';
  cursor: Scalars['String'];
  /** An edge adhering to the Relay Connection spec */
  node: CloudOrganization;
}

/** A CloudProject represents a Project stored in the Cypress Cloud */
export interface CloudProject extends Node {
  __typename: 'CloudProject';
  /** Globally unique identifier representing a concrete GraphQL ObjectType */
  id: Scalars['ID'];
  /** The latest run for a given spec */
  latestRun?: Maybe<CloudRun>;
  /** The organization the project is a member of */
  organization?: Maybe<CloudOrganization>;
  /** Record keys for the service */
  recordKeys?: Maybe<Array<CloudRecordKey>>;
  /** A connection field type */
  runs?: Maybe<CloudRunConnection>;
  /** Unique identifier for a Project */
  slug: Scalars['String'];
}


/** A CloudProject represents a Project stored in the Cypress Cloud */
export interface CloudProjectRunsArgs {
  after?: Maybe<Scalars['String']>;
  before?: Maybe<Scalars['String']>;
  cypressVersion?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  last?: Maybe<Scalars['Int']>;
  status?: Maybe<CloudRunStatus>;
}

/** A Connection adhering to the Relay Specification */
export interface CloudProjectConnection {
  __typename: 'CloudProjectConnection';
  /** A list of edges. */
  edges: Array<CloudProjectEdge>;
  /** A list of nodes. */
  nodes: Array<CloudProject>;
  /** PageInfo result for the connection */
  pageInfo: PageInfo;
}

export interface CloudProjectEdge {
  __typename: 'CloudProjectEdge';
  cursor: Scalars['String'];
  /** An edge adhering to the Relay Connection spec */
  node: CloudProject;
}

export interface CloudRecordKey extends Node {
  __typename: 'CloudRecordKey';
  createdAt?: Maybe<Scalars['DateTime']>;
  /** Globally unique identifier representing a concrete GraphQL ObjectType */
  id: Scalars['ID'];
  /** The Record Key */
  key?: Maybe<Scalars['String']>;
  lastUsedAt?: Maybe<Scalars['DateTime']>;
}

/** A Recorded run of the Test Runner, typically to the cloud */
export interface CloudRun extends Node {
  __typename: 'CloudRun';
  commitInfo?: Maybe<CloudRunCommitInfo>;
  createdAt?: Maybe<Scalars['Date']>;
  /** Globally unique identifier representing a concrete GraphQL ObjectType */
  id: Scalars['ID'];
  status?: Maybe<CloudRunStatus>;
  /** Total duration of the run in milliseconds, accounting for any parallelization */
  totalDuration?: Maybe<Scalars['Int']>;
  /** This is the number of failed tests across all groups in the run */
  totalFailed?: Maybe<Scalars['Int']>;
  /** This is the number of passed tests across all groups in the run */
  totalPassed?: Maybe<Scalars['Int']>;
  /** This is the number of pending tests across all groups in the run */
  totalPending?: Maybe<Scalars['Int']>;
  /** This is the number of running tests across all groups in the run */
  totalRunning?: Maybe<Scalars['Int']>;
  /** This is the number of skipped tests across all groups in the run */
  totalSkipped?: Maybe<Scalars['Int']>;
  /** This is the number of tests across all groups in the run */
  totalTests?: Maybe<Scalars['Int']>;
}

export interface CloudRunCommitInfo {
  __typename: 'CloudRunCommitInfo';
  authorAvatar?: Maybe<Scalars['String']>;
  authorEmail?: Maybe<Scalars['String']>;
  authorName?: Maybe<Scalars['String']>;
  branch?: Maybe<Scalars['String']>;
  branchUrl?: Maybe<Scalars['String']>;
  message?: Maybe<Scalars['String']>;
  sha?: Maybe<Scalars['String']>;
  summary?: Maybe<Scalars['String']>;
  url?: Maybe<Scalars['String']>;
}


export interface CloudRunCommitInfoMessageArgs {
  truncate?: Maybe<Scalars['Int']>;
}

/** Connection type for CloudRun, adhering to the Relay Connection spec */
export interface CloudRunConnection {
  __typename: 'CloudRunConnection';
  /** A list of edges. */
  edges: Array<CloudRunEdge>;
  /** A list of nodes. */
  nodes: Array<CloudRun>;
  /** PageInfo result for the connection */
  pageInfo: PageInfo;
}

/** Represents an individual Cloud test Run */
export interface CloudRunEdge {
  __typename: 'CloudRunEdge';
  cursor: Scalars['String'];
  /** The item at the end of the edge. */
  node: CloudRun;
}

/** Possible check status of the test run */
export type CloudRunStatus =
  | 'CANCELLED'
  | 'ERRORED'
  | 'FAILED'
  | 'NOTESTS'
  | 'OVERLIMIT'
  | 'PASSED'
  | 'RUNNING'
  | 'TIMEDOUT';

/** A CloudUser represents an User stored in the Cypress Cloud */
export interface CloudUser extends Node {
  __typename: 'CloudUser';
  email?: Maybe<Scalars['String']>;
  /** The display name of the user, if we have one */
  fullName?: Maybe<Scalars['String']>;
  /** Globally unique identifier representing a concrete GraphQL ObjectType */
  id: Scalars['ID'];
  /** A connection field type */
  organizations?: Maybe<CloudOrganizationConnection>;
  /** Whether this user is the currently authenticated user */
  userIsViewer: Scalars['Boolean'];
}


/** A CloudUser represents an User stored in the Cypress Cloud */
export interface CloudUserOrganizationsArgs {
  after?: Maybe<Scalars['String']>;
  before?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  last?: Maybe<Scalars['Int']>;
}

export type CodeGenType =
  | 'component'
  | 'story';

export type CodeLanguageEnum =
  | 'js'
  | 'ts';

export type DevRelaunchAction =
  | 'dismiss'
  | 'trigger';

/** State associated/helpful for local development of Cypress */
export interface DevState {
  __typename: 'DevState';
  /** When we have edited server related files, we may want to relaunch the client. */
  needsRelaunch?: Maybe<Scalars['Boolean']>;
}

/** Represents a spec on the file system */
export interface FileParts extends Node {
  __typename: 'FileParts';
  /** Absolute path to spec (e.g. /Users/jess/my-project/src/component/MySpec.test.tsx) */
  absolute: Scalars['String'];
  /** Full name of spec file (e.g. MySpec.test.tsx) without the spec extension */
  baseName: Scalars['String'];
  /** The first part of the file, without extensions (e.g. MySpec) */
  fileName: Scalars['String'];
  /** Relay style Node ID field for the FileParts field */
  id: Scalars['ID'];
  /** Full name of spec file (e.g. MySpec.test.tsx) */
  name: Scalars['String'];
  /** Relative path to spec (e.g. src/component/MySpec.test.tsx) */
  relative: Scalars['String'];
}

export interface FilePartsConnection {
  __typename: 'FilePartsConnection';
  /** https://facebook.github.io/relay/graphql/connections.htm#sec-Edge-Types */
  edges: Array<FilePartsEdge>;
  /** https://facebook.github.io/relay/graphql/connections.htm#sec-undefined.PageInfo */
  pageInfo: PageInfo;
}

export interface FilePartsEdge {
  __typename: 'FilePartsEdge';
  /** https://facebook.github.io/relay/graphql/connections.htm#sec-Cursor */
  cursor: Scalars['String'];
  /** https://facebook.github.io/relay/graphql/connections.htm#sec-Node */
  node: FileParts;
}

export type FrontendFrameworkEnum =
  | 'cra'
  | 'nextjs'
  | 'nuxtjs'
  | 'react'
  | 'vue'
  | 'vuecli';

export interface GeneratedSpec {
  __typename: 'GeneratedSpec';
  /** File content of most recently generated spec. */
  content: Scalars['String'];
  id: Scalars['ID'];
  spec: FileParts;
}

/** Git information about a spec file */
export interface GitInfo {
  __typename: 'GitInfo';
  /** Last person to change the file in git */
  author?: Maybe<Scalars['String']>;
  /** last modified as a pretty string, eg 2 days ago */
  lastModifiedHumanReadable?: Maybe<Scalars['String']>;
  /** last modified timestamp, eg 2021-09-14 13:43:19 +1000 */
  lastModifiedTimestamp?: Maybe<Scalars['String']>;
}

export interface Mutation {
  __typename: 'Mutation';
  /** Add project to projects array and cache it */
  addProject?: Maybe<Scalars['Boolean']>;
  /** Create an Index HTML file for a new component testing project */
  appCreateComponentIndexHtml?: Maybe<Scalars['Boolean']>;
  /** Create a Cypress config file for a new project */
  appCreateConfigFile?: Maybe<Scalars['Boolean']>;
  clearActiveProject?: Maybe<Scalars['Boolean']>;
  /** Development only: Triggers or dismisses a prompted refresh by touching the file watched by our development scripts */
  devRelaunch?: Maybe<Scalars['Boolean']>;
  /** Generate spec from Storybook story */
  generateSpecFromStory?: Maybe<Scalars['Boolean']>;
  /** Hides the launchpad windows */
  hideBrowserWindow: App;
  /** Initializes open_project global singleton to manager current project state */
  initializeOpenProject?: Maybe<Scalars['Boolean']>;
  internal_clearAllProjectPreferencesCache?: Maybe<Scalars['Boolean']>;
  internal_clearLatestProjectCache?: Maybe<Scalars['Boolean']>;
  internal_clearProjectPreferencesCache?: Maybe<Scalars['Boolean']>;
  internal_triggerIpcToApp?: Maybe<Scalars['Boolean']>;
  internal_triggerIpcToLaunchpad?: Maybe<Scalars['Boolean']>;
  /** Launches project from open_project global singleton */
  launchOpenProject?: Maybe<Scalars['Boolean']>;
  /** Sets the active browser */
  launchpadSetBrowser?: Maybe<Scalars['Boolean']>;
  /** Auth with Cypress Cloud */
  login?: Maybe<Scalars['Boolean']>;
  /** Log out of Cypress Cloud */
  logout?: Maybe<Scalars['Boolean']>;
  /** Set the current navigation item */
  navigationMenuSetItem?: Maybe<Scalars['Boolean']>;
  /** Remove project from projects array and cache */
  removeProject?: Maybe<Scalars['Boolean']>;
  /** Set active project to run tests on */
  setActiveProject?: Maybe<Scalars['Boolean']>;
  /** Set the current spec under test */
  setCurrentSpec?: Maybe<Scalars['Boolean']>;
  /** Save the projects preferences to cache */
  setProjectPreferences: App;
  /** show the launchpad windows */
  showBrowserWindow: App;
  /** Installs the dependencies for the component testing step */
  wizardInstallDependencies?: Maybe<Wizard>;
  /** Sets the frontend bundler we want to use for the project */
  wizardSetBundler?: Maybe<Scalars['Boolean']>;
  /** Sets the language we want to use for the config file */
  wizardSetCodeLanguage?: Maybe<Scalars['Boolean']>;
  /** Sets the frontend framework we want to use for the project */
  wizardSetFramework?: Maybe<Scalars['Boolean']>;
  /** Updates the different fields of the wizard data store */
  wizardUpdate?: Maybe<Scalars['Boolean']>;
  /** Validates that the manual install has occurred properly */
  wizardValidateManualInstall?: Maybe<Wizard>;
}


export interface MutationAddProjectArgs {
  open?: Maybe<Scalars['Boolean']>;
  path: Scalars['String'];
}


export interface MutationAppCreateComponentIndexHtmlArgs {
  template: Scalars['String'];
}


export interface MutationAppCreateConfigFileArgs {
  code: Scalars['String'];
  configFilename: Scalars['String'];
}


export interface MutationDevRelaunchArgs {
  action: DevRelaunchAction;
}


export interface MutationGenerateSpecFromStoryArgs {
  storyPath: Scalars['String'];
}


export interface MutationInternal_ClearProjectPreferencesCacheArgs {
  projectTitle: Scalars['String'];
}


export interface MutationInternal_TriggerIpcToLaunchpadArgs {
  msg: Scalars['String'];
}


export interface MutationLaunchpadSetBrowserArgs {
  id: Scalars['ID'];
}


export interface MutationNavigationMenuSetItemArgs {
  type: NavItem;
}


export interface MutationRemoveProjectArgs {
  path: Scalars['String'];
}


export interface MutationSetActiveProjectArgs {
  path: Scalars['String'];
}


export interface MutationSetCurrentSpecArgs {
  id: Scalars['ID'];
}


export interface MutationSetProjectPreferencesArgs {
  browserId: Scalars['ID'];
  testingType: TestingTypeEnum;
}


export interface MutationWizardSetBundlerArgs {
  bundler: SupportedBundlers;
}


export interface MutationWizardSetCodeLanguageArgs {
  language: CodeLanguageEnum;
}


export interface MutationWizardSetFrameworkArgs {
  framework: FrontendFrameworkEnum;
}


export interface MutationWizardUpdateArgs {
  input: WizardUpdateInput;
}

export type NavItem =
  | 'learn'
  | 'projectSetup'
  | 'runs'
  | 'settings';

/** Container describing a single nav item */
export interface NavigationItem extends Node {
  __typename: 'NavigationItem';
  iconPath: Scalars['String'];
  /** Relay style Node ID field for the NavigationItem field */
  id: Scalars['ID'];
  name: Scalars['String'];
  selected: Scalars['Boolean'];
  type: NavItem;
}

/** Container for state associated with the side navigation menu */
export interface NavigationMenu {
  __typename: 'NavigationMenu';
  items: Array<NavigationItem>;
  selected: NavItem;
}

/** Implements the Relay Node spec */
export interface Node {
  /** Globally unique identifier representing a concrete GraphQL ObjectType */
  id: Scalars['ID'];
}

/**
 * PageInfo object, adhering to the Relay Connection Spec:
 *
 * https://relay.dev/graphql/connections.htm#sec-undefined.PageInfo
 */
export interface PageInfo {
  __typename: 'PageInfo';
  /** Must be the cursor corresponding to the last node in edges. Null if no such node exists */
  endCursor?: Maybe<Scalars['String']>;
  /**
   * Used to indicate whether more edges exist following the set defined by the clients arguments.
   * If the client is paginating with first/after, then the server must return true if further edges
   * exist, otherwise false. If the client is paginating with last/before, then the client may return
   * true if edges further from before exist, if it can do so efficiently, otherwise may return false.
   */
  hasNextPage: Scalars['Boolean'];
  /**
   * Used to indicate whether more edges exist prior to the set defined by the clients arguments.
   * If the client is paginating with last/before, then the server must return true if prior edges exist,
   * otherwise false. If the client is paginating with first/after, then the client may return true if
   * edges prior to after exist, if it can do so efficiently, otherwise may return false.
   */
  hasPreviousPage: Scalars['Boolean'];
  /** Must be the cursor corresponding to the first node in edges. Null if no such node exists */
  startCursor?: Maybe<Scalars['String']>;
}

export type PluginsState =
  | 'error'
  | 'initialized'
  | 'initializing'
  | 'uninitialized';

/** A Cypress Project is represented by a cypress.json file */
export interface Project extends Node {
  __typename: 'Project';
  /** The remote associated project from Cypress Cloud */
  cloudProject?: Maybe<CloudProject>;
  /** List of all code generation candidates stories */
  codeGenCandidates?: Maybe<FilePartsConnection>;
  /** Glob pattern for component searching */
  codeGenGlob: Scalars['String'];
  /** Project configuration */
  config: Scalars['JSON'];
  /** Currently selected spec */
  currentSpec?: Maybe<Spec>;
  generatedSpec?: Maybe<GeneratedSpec>;
  /** Relay style Node ID field for the Project field */
  id: Scalars['ID'];
  /** Whether the user configured this project to use Component Testing */
  isFirstTimeCT: Scalars['Boolean'];
  /** Whether the user configured this project to use e2e Testing */
  isFirstTimeE2E: Scalars['Boolean'];
  /** Cached preferences for this project */
  preferences?: Maybe<ProjectPreferences>;
  /** Used to associate project with Cypress cloud */
  projectId?: Maybe<Scalars['String']>;
  projectRoot: Scalars['String'];
  /** Specs for a project conforming to Relay Connection specification */
  specs?: Maybe<SpecConnection>;
  storybook?: Maybe<Storybook>;
  title: Scalars['String'];
}


/** A Cypress Project is represented by a cypress.json file */
export interface ProjectCodeGenCandidatesArgs {
  after?: Maybe<Scalars['String']>;
  before?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  glob: Scalars['String'];
  last?: Maybe<Scalars['Int']>;
}


/** A Cypress Project is represented by a cypress.json file */
export interface ProjectCodeGenGlobArgs {
  type: CodeGenType;
}


/** A Cypress Project is represented by a cypress.json file */
export interface ProjectSpecsArgs {
  after?: Maybe<Scalars['String']>;
  before?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  last?: Maybe<Scalars['Int']>;
}

/** Preferences specific to a project */
export interface ProjectPreferences {
  __typename: 'ProjectPreferences';
  /** The preferred browser to launch */
  browserId?: Maybe<Scalars['String']>;
  /** The preferred testing type to start in */
  testingType?: Maybe<Scalars['String']>;
}

/** The root "Query" type containing all entry fields for our querying */
export interface Query {
  __typename: 'Query';
  app: App;
  baseError?: Maybe<BaseError>;
  /** Returns an object conforming to the Relay spec */
  cloudNode?: Maybe<Node>;
  /** Lookup an individual project by the slug */
  cloudProjectBySlug?: Maybe<CloudProject>;
  /** Lookup a list of projects by their slug */
  cloudProjectsBySlugs?: Maybe<Array<Maybe<CloudProject>>>;
  /** A user within the Cypress Cloud */
  cloudViewer?: Maybe<CloudUser>;
  /** The state of any info related to local development of the runner */
  dev: DevState;
  /** Metadata about the nagivation menu */
  navigationMenu?: Maybe<NavigationMenu>;
  /** Metadata about the wizard, null if we arent showing the wizard */
  wizard: Wizard;
}


/** The root "Query" type containing all entry fields for our querying */
export interface QueryCloudNodeArgs {
  id: Scalars['ID'];
}


/** The root "Query" type containing all entry fields for our querying */
export interface QueryCloudProjectBySlugArgs {
  slug: Scalars['String'];
}


/** The root "Query" type containing all entry fields for our querying */
export interface QueryCloudProjectsBySlugsArgs {
  slugs: Array<Scalars['String']>;
}

/** Represents a spec on the file system */
export interface Spec extends Node {
  __typename: 'Spec';
  /** Absolute path to spec (e.g. /Users/jess/my-project/src/component/MySpec.test.tsx) */
  absolute: Scalars['String'];
  /** Full name of spec file (e.g. MySpec.test.tsx) without the spec extension */
  baseName: Scalars['String'];
  /** The file extension (e.g. tsx, jsx) */
  fileExtension: Scalars['String'];
  /** The first part of the file, without extensions (e.g. MySpec) */
  fileName: Scalars['String'];
  /** Git information about the spec file */
  gitInfo?: Maybe<GitInfo>;
  /** Relay style Node ID field for the Spec field */
  id: Scalars['ID'];
  /** Full name of spec file (e.g. MySpec.test.tsx) */
  name: Scalars['String'];
  /** Relative path to spec (e.g. src/component/MySpec.test.tsx) */
  relative: Scalars['String'];
  /** The spec file's extension, including "spec" patterm (e.g. .spec.tsx, -spec.tsx, -test.tsx) */
  specFileExtension: Scalars['String'];
  /** Type of spec (e.g. component | integration) */
  specType: SpecType;
}

export interface SpecConnection {
  __typename: 'SpecConnection';
  /** https://facebook.github.io/relay/graphql/connections.htm#sec-Edge-Types */
  edges: Array<SpecEdge>;
  /** https://facebook.github.io/relay/graphql/connections.htm#sec-undefined.PageInfo */
  pageInfo: PageInfo;
}

export interface SpecEdge {
  __typename: 'SpecEdge';
  /** https://facebook.github.io/relay/graphql/connections.htm#sec-Cursor */
  cursor: Scalars['String'];
  /** https://facebook.github.io/relay/graphql/connections.htm#sec-Node */
  node: Spec;
}

export type SpecType =
  | 'component'
  | 'integration';

/** Storybook */
export interface Storybook extends Node {
  __typename: 'Storybook';
  /** Relay style Node ID field for the Storybook field */
  id: Scalars['ID'];
  /** Folder containing storybook configuration files */
  storybookRoot: Scalars['String'];
}

/** The bundlers that we can use with Cypress */
export type SupportedBundlers =
  | 'vite'
  | 'webpack';

export type TestingTypeEnum =
  | 'component'
  | 'e2e';

export interface TestingTypeInfo extends Node {
  __typename: 'TestingTypeInfo';
  description: Scalars['String'];
  /** Relay style Node ID field for the TestingTypeInfo field */
  id: Scalars['ID'];
  title: Scalars['String'];
  type: TestingTypeEnum;
}

/** The Wizard is a container for any state associated with initial onboarding to Cypress */
export interface Wizard {
  __typename: 'Wizard';
  /** All of the bundlers to choose from */
  allBundlers: Array<WizardBundler>;
  /** All of the languages to choose from */
  allLanguages: Array<WizardCodeLanguage>;
  bundler?: Maybe<WizardBundler>;
  /** Given the current state, returns whether the user progress to the next step of the wizard */
  canNavigateForward: Scalars['Boolean'];
  /** Whether the plugins for the selected testing type has been initialized */
  chosenTestingTypePluginsInitialized: Scalars['Boolean'];
  /** The title of the page, given the current step of the wizard */
  description?: Maybe<Scalars['String']>;
  framework?: Maybe<WizardFrontendFramework>;
  /** All of the component testing frameworks to choose from */
  frameworks: Array<WizardFrontendFramework>;
  /** Whether we have chosen manual install or not */
  isManualInstall: Scalars['Boolean'];
  language?: Maybe<WizardCodeLanguage>;
  /** A list of packages to install, null if we have not chosen both a framework and bundler */
  packagesToInstall?: Maybe<Array<WizardNpmPackage>>;
  /** Set of sample configuration files based bundler, framework and language of choice */
  sampleConfigFiles?: Maybe<Array<WizardSampleConfigFile>>;
  /** IndexHtml file based on bundler and framework of choice */
  sampleTemplate?: Maybe<Scalars['String']>;
  step: WizardStep;
  /** The testing type we are setting in the wizard, null if this has not been chosen */
  testingType?: Maybe<TestingTypeEnum>;
  testingTypes: Array<TestingTypeInfo>;
  /** The title of the page, given the current step of the wizard */
  title?: Maybe<Scalars['String']>;
}

/** Wizard bundler */
export interface WizardBundler extends Node {
  __typename: 'WizardBundler';
  /** Relay style Node ID field for the WizardBundler field */
  id: Scalars['ID'];
  /** Whether this is the selected framework bundler */
  isSelected?: Maybe<Scalars['Boolean']>;
  /** Display name of the bundler */
  name: Scalars['String'];
  /** Package to install associated with the bundler */
  package: Scalars['String'];
  /** The name of the framework */
  type: SupportedBundlers;
}

/** A code language that the user can choose from to create their cypress.config */
export interface WizardCodeLanguage extends Node {
  __typename: 'WizardCodeLanguage';
  /** Relay style Node ID field for the WizardCodeLanguage field */
  id: Scalars['ID'];
  /** Whether this is the selected language in the wizard */
  isSelected: Scalars['Boolean'];
  /** The name of the language */
  name: Scalars['String'];
  /** The key of the language */
  type: CodeLanguageEnum;
}

export type WizardConfigFileStatusEnum =
  | 'changes'
  | 'error'
  | 'skipped'
  | 'valid';

/** A frontend framework that we can setup within the app */
export interface WizardFrontendFramework extends Node {
  __typename: 'WizardFrontendFramework';
  /** Relay style Node ID field for the WizardFrontendFramework field */
  id: Scalars['ID'];
  /** Whether this is the selected framework in the wizard */
  isSelected: Scalars['Boolean'];
  /** The name of the framework */
  name: Scalars['String'];
  /** All of the supported bundlers for this framework */
  supportedBundlers: Array<WizardBundler>;
  /** The name of the framework */
  type: FrontendFrameworkEnum;
}

export type WizardNavigateDirection =
  | 'back'
  | 'forward';

/** Details about an NPM Package listed during the wizard install */
export interface WizardNpmPackage extends Node {
  __typename: 'WizardNpmPackage';
  description: Scalars['String'];
  /** Relay style Node ID field for the WizardNpmPackage field */
  id: Scalars['ID'];
  /** The package name that you would npm install */
  name: Scalars['String'];
  package: Scalars['String'];
}

/** Each config file suggestion given by the wizard */
export interface WizardSampleConfigFile extends Node {
  __typename: 'WizardSampleConfigFile';
  content: Scalars['String'];
  description?: Maybe<Scalars['String']>;
  filePath: Scalars['String'];
  /** Relay style Node ID field for the WizardSampleConfigFile field */
  id: Scalars['ID'];
  status: WizardConfigFileStatusEnum;
}

export type WizardStep =
  | 'configFiles'
  | 'initializePlugins'
  | 'installDependencies'
  | 'selectFramework'
  | 'setupComplete'
  | 'welcome';

export interface WizardUpdateInput {
  direction?: Maybe<WizardNavigateDirection>;
  testingType?: Maybe<TestingTypeEnum>;
}

export interface CodegenTypeMap {
  App: App,
  BaseError: BaseError,
  Browser: Browser,
  CloudOrganization: CloudOrganization,
  CloudOrganizationConnection: CloudOrganizationConnection,
  CloudOrganizationEdge: CloudOrganizationEdge,
  CloudProject: CloudProject,
  CloudProjectConnection: CloudProjectConnection,
  CloudProjectEdge: CloudProjectEdge,
  CloudRecordKey: CloudRecordKey,
  CloudRun: CloudRun,
  CloudRunCommitInfo: CloudRunCommitInfo,
  CloudRunConnection: CloudRunConnection,
  CloudRunEdge: CloudRunEdge,
  CloudUser: CloudUser,
  DevState: DevState,
  FileParts: FileParts,
  FilePartsConnection: FilePartsConnection,
  FilePartsEdge: FilePartsEdge,
  GeneratedSpec: GeneratedSpec,
  GitInfo: GitInfo,
  Mutation: Mutation,
  NavigationItem: NavigationItem,
  NavigationMenu: NavigationMenu,
  Node: Node,
  PageInfo: PageInfo,
  Project: Project,
  ProjectPreferences: ProjectPreferences,
  Query: Query,
  Spec: Spec,
  SpecConnection: SpecConnection,
  SpecEdge: SpecEdge,
  Storybook: Storybook,
  TestingTypeInfo: TestingTypeInfo,
  Wizard: Wizard,
  WizardBundler: WizardBundler,
  WizardCodeLanguage: WizardCodeLanguage,
  WizardFrontendFramework: WizardFrontendFramework,
  WizardNpmPackage: WizardNpmPackage,
  WizardSampleConfigFile: WizardSampleConfigFile,
}
