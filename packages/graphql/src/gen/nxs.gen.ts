/* eslint-disable */
/**
 * This file was generated by Nexus Schema
 * Do not make changes to this file directly
 */

import type * as cloudGen from "./cloud-source-types.gen"
import type { BaseContext } from "./../context/BaseContext"
import type { Query } from "./../entities/Query"
import type { App } from "./../entities/App"
import type { NavigationMenu } from "./../entities/NavigationMenu"
import type { ResolvedOptionBase, ResolvedStringOption, ResolvedStringListOption, ResolvedNumberOption, ResolvedBooleanOption, ResolvedJsonOption, ResolvedConfig } from "./../entities/ResolvedConfig"
import type { TestingTypeInfo } from "./../entities/TestingTypeInfo"
import type { Wizard } from "./../entities/Wizard"
import type { WizardBundler } from "./../entities/WizardBundler"
import type { WizardFrontendFramework } from "./../entities/WizardFrontendFramework"
import type { WizardNpmPackage } from "./../entities/WizardNpmPackage"
import type { Project } from "./../entities/Project"
import type { Browser } from "./../entities/Browser"
import type { NavigationItem } from "./../entities/NavigationItem"
import type { core } from "nexus"
declare global {
  interface NexusGenCustomInputMethods<TypeName extends string> {
    /**
     * The `JSON` scalar type represents JSON values as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf).
     */
    json<FieldName extends string>(fieldName: FieldName, opts?: core.CommonInputFieldConfig<TypeName, FieldName>): void // "JSON";
    /**
     * A date-time string at UTC, such as 2007-12-03T10:15:30Z, compliant with the `date-time` format outlined in section 5.6 of the RFC 3339 profile of the ISO 8601 standard for representation of dates and times using the Gregorian calendar.
     */
    dateTime<FieldName extends string>(fieldName: FieldName, opts?: core.CommonInputFieldConfig<TypeName, FieldName>): void // "DateTime";
  }
}
declare global {
  interface NexusGenCustomOutputMethods<TypeName extends string> {
    /**
     * The `JSON` scalar type represents JSON values as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf).
     */
    json<FieldName extends string>(fieldName: FieldName, ...opts: core.ScalarOutSpread<TypeName, FieldName>): void // "JSON";
    /**
     * A date-time string at UTC, such as 2007-12-03T10:15:30Z, compliant with the `date-time` format outlined in section 5.6 of the RFC 3339 profile of the ISO 8601 standard for representation of dates and times using the Gregorian calendar.
     */
    dateTime<FieldName extends string>(fieldName: FieldName, ...opts: core.ScalarOutSpread<TypeName, FieldName>): void // "DateTime";
  }
}


declare global {
  interface NexusGen extends NexusGenTypes {}
}

export interface NexusGenInputs {
}

export interface NexusGenEnums {
  BrowserFamily: "chromium" | "firefox"
  CloudRunStatus: cloudGen.CloudRunStatus
  FrontendFramework: "cra" | "nextjs" | "nuxtjs" | "react" | "vue" | "vuecli"
  NavItem: "learn" | "projectSetup" | "runs" | "settings"
  PluginsState: "error" | "initialized" | "initializing" | "uninitialized"
  ResolvedConfigOption: "config" | "default" | "env" | "plugin" | "runtime"
  ResolvedType: "array" | "boolean" | "json" | "number" | "string"
  SupportedBundlers: "vite" | "webpack"
  TestingTypeEnum: "component" | "e2e"
  WizardCodeLanguage: "js" | "ts"
  WizardNavigateDirection: "back" | "forward"
  WizardStep: "createConfig" | "installDependencies" | "selectFramework" | "setupComplete" | "welcome"
}

export interface NexusGenScalars {
  String: string
  Int: number
  Float: number
  Boolean: boolean
  ID: string
  Date: any
  DateTime: any
  JSON: any
}

export interface NexusGenObjects {
  App: App;
  Browser: Browser;
  CloudOrganization: cloudGen.CloudOrganization;
  CloudOrganizationConnection: cloudGen.CloudOrganizationConnection;
  CloudOrganizationEdge: cloudGen.CloudOrganizationEdge;
  CloudProject: cloudGen.CloudProject;
  CloudProjectConnection: cloudGen.CloudProjectConnection;
  CloudProjectEdge: cloudGen.CloudProjectEdge;
  CloudRecordKey: cloudGen.CloudRecordKey;
  CloudRun: cloudGen.CloudRun;
  CloudRunCommitInfo: cloudGen.CloudRunCommitInfo;
  CloudRunConnection: cloudGen.CloudRunConnection;
  CloudRunEdge: cloudGen.CloudRunEdge;
  CloudUser: cloudGen.CloudUser;
  Mutation: {};
  NavigationItem: NavigationItem;
  NavigationMenu: NavigationMenu;
  PageInfo: cloudGen.PageInfo;
  Project: Project;
  Query: Query;
  ResolvedBooleanOption: ResolvedBooleanOption;
  ResolvedConfig: ResolvedConfig;
  ResolvedJsonOption: ResolvedJsonOption;
  ResolvedNumberOption: ResolvedNumberOption;
  ResolvedStringListOption: ResolvedStringListOption;
  ResolvedStringOption: ResolvedStringOption;
  TestingTypeInfo: TestingTypeInfo;
  Wizard: Wizard;
  WizardBundler: WizardBundler;
  WizardFrontendFramework: WizardFrontendFramework;
  WizardNpmPackage: WizardNpmPackage;
}

export interface NexusGenInterfaces {
  Node: cloudGen.Node;
  ResolvedOptionBase: ResolvedOptionBase;
}

export interface NexusGenUnions {
}

export type NexusGenRootTypes = NexusGenInterfaces & NexusGenObjects

export type NexusGenAllTypes = NexusGenRootTypes & NexusGenScalars & NexusGenEnums

export interface NexusGenFieldTypes {
  App: { // field return type
    activeProject: NexusGenRootTypes['Project'] | null; // Project
    browsers: NexusGenRootTypes['Browser'][]; // [Browser!]!
    isFirstOpen: boolean; // Boolean!
    projects: NexusGenRootTypes['Project'][]; // [Project!]!
  }
  Browser: { // field return type
    channel: string; // String!
    displayName: string; // String!
    family: NexusGenEnums['BrowserFamily']; // BrowserFamily!
    id: string; // String!
    majorVersion: string | null; // String
    name: string; // String!
    path: string; // String!
    version: string; // String!
  }
  CloudOrganization: { // field return type
    id: string; // ID!
    name: string | null; // String
    projects: NexusGenRootTypes['CloudProjectConnection'] | null; // CloudProjectConnection
  }
  CloudOrganizationConnection: { // field return type
    edges: NexusGenRootTypes['CloudOrganizationEdge'][]; // [CloudOrganizationEdge!]!
    nodes: NexusGenRootTypes['CloudOrganization'][]; // [CloudOrganization!]!
    pageInfo: NexusGenRootTypes['PageInfo']; // PageInfo!
  }
  CloudOrganizationEdge: { // field return type
    cursor: string; // String!
    node: NexusGenRootTypes['CloudOrganization']; // CloudOrganization!
  }
  CloudProject: { // field return type
    id: string; // ID!
    latestRun: NexusGenRootTypes['CloudRun'] | null; // CloudRun
    organization: NexusGenRootTypes['CloudOrganization'] | null; // CloudOrganization
    recordKeys: NexusGenRootTypes['CloudRecordKey'][] | null; // [CloudRecordKey!]
    runs: NexusGenRootTypes['CloudRunConnection'] | null; // CloudRunConnection
    slug: string; // String!
  }
  CloudProjectConnection: { // field return type
    edges: NexusGenRootTypes['CloudProjectEdge'][]; // [CloudProjectEdge!]!
    nodes: NexusGenRootTypes['CloudProject'][]; // [CloudProject!]!
    pageInfo: NexusGenRootTypes['PageInfo']; // PageInfo!
  }
  CloudProjectEdge: { // field return type
    cursor: string; // String!
    node: NexusGenRootTypes['CloudProject']; // CloudProject!
  }
  CloudRecordKey: { // field return type
    createdAt: string | null; // String
    id: string; // ID!
    key: string | null; // String
    lastUsedAt: string | null; // String
  }
  CloudRun: { // field return type
    commitInfo: NexusGenRootTypes['CloudRunCommitInfo'] | null; // CloudRunCommitInfo
    createdAt: NexusGenScalars['Date'] | null; // Date
    id: string; // ID!
    status: NexusGenEnums['CloudRunStatus'] | null; // CloudRunStatus
    totalDuration: number | null; // Int
    totalFailed: number | null; // Int
    totalPassed: number | null; // Int
    totalPending: number | null; // Int
    totalRunning: number | null; // Int
    totalSkipped: number | null; // Int
    totalTests: number | null; // Int
  }
  CloudRunCommitInfo: { // field return type
    authorAvatar: string | null; // String
    authorEmail: string | null; // String
    authorName: string | null; // String
    branch: string | null; // String
    branchUrl: string | null; // String
    message: string | null; // String
    sha: string | null; // String
    summary: string | null; // String
    url: string | null; // String
  }
  CloudRunConnection: { // field return type
    edges: NexusGenRootTypes['CloudRunEdge'][]; // [CloudRunEdge!]!
    nodes: NexusGenRootTypes['CloudRun'][]; // [CloudRun!]!
    pageInfo: NexusGenRootTypes['PageInfo']; // PageInfo!
  }
  CloudRunEdge: { // field return type
    cursor: string; // String!
    node: NexusGenRootTypes['CloudRun']; // CloudRun!
  }
  CloudUser: { // field return type
    email: string | null; // String
    fullName: string | null; // String
    id: string; // ID!
    organizations: NexusGenRootTypes['CloudOrganizationConnection'] | null; // CloudOrganizationConnection
    userIsViewer: boolean; // Boolean!
  }
  Mutation: { // field return type
    appCreateConfigFile: NexusGenRootTypes['App'] | null; // App
    initializeOpenProject: NexusGenRootTypes['App'] | null; // App
    launchOpenProject: NexusGenRootTypes['App'] | null; // App
    login: NexusGenRootTypes['Query'] | null; // Query
    logout: NexusGenRootTypes['Query'] | null; // Query
    navigationMenuSetItem: NexusGenRootTypes['NavigationMenu'] | null; // NavigationMenu
    wizardInstallDependencies: NexusGenRootTypes['Wizard'] | null; // Wizard
    wizardNavigate: NexusGenRootTypes['Wizard'] | null; // Wizard
    wizardSetBundler: NexusGenRootTypes['Wizard'] | null; // Wizard
    wizardSetFramework: NexusGenRootTypes['Wizard'] | null; // Wizard
    wizardSetManualInstall: NexusGenRootTypes['Wizard'] | null; // Wizard
    wizardSetTestingType: NexusGenRootTypes['Wizard'] | null; // Wizard
    wizardValidateManualInstall: NexusGenRootTypes['Wizard'] | null; // Wizard
  }
  NavigationItem: { // field return type
    iconPath: string; // String!
    id: NexusGenEnums['NavItem']; // NavItem!
    name: string; // String!
    selected: boolean; // Boolean!
  }
  NavigationMenu: { // field return type
    items: NexusGenRootTypes['NavigationItem'][]; // [NavigationItem!]!
    selected: NexusGenEnums['NavItem']; // NavItem!
  }
  PageInfo: { // field return type
    endCursor: string | null; // String
    hasNextPage: boolean; // Boolean!
    hasPreviousPage: boolean; // Boolean!
    startCursor: string | null; // String
  }
  Project: { // field return type
    cloudProject: NexusGenRootTypes['CloudProject'] | null; // CloudProject
    hasSetupComponentTesting: boolean; // Boolean!
    hasSetupE2ETesting: boolean; // Boolean!
    id: string; // ID!
    projectId: string | null; // String
    projectRoot: string; // String!
    resolvedConfig: NexusGenRootTypes['ResolvedConfig'] | null; // ResolvedConfig
    title: string; // String!
  }
  Query: { // field return type
    app: NexusGenRootTypes['App']; // App!
    cloudNode: NexusGenRootTypes['Node'] | null; // Node
    cloudProjectBySlug: NexusGenRootTypes['CloudProject'] | null; // CloudProject
    cloudProjectsBySlugs: Array<NexusGenRootTypes['CloudProject'] | null> | null; // [CloudProject]
    cloudViewer: NexusGenRootTypes['CloudUser'] | null; // CloudUser
    navigationMenu: NexusGenRootTypes['NavigationMenu'] | null; // NavigationMenu
    wizard: NexusGenRootTypes['Wizard'] | null; // Wizard
  }
  ResolvedBooleanOption: { // field return type
    from: NexusGenEnums['ResolvedConfigOption'] | null; // ResolvedConfigOption
    type: NexusGenEnums['ResolvedType']; // ResolvedType!
    value: boolean | null; // Boolean
  }
  ResolvedConfig: { // field return type
    animationDistanceThreshold: NexusGenRootTypes['ResolvedNumberOption'] | null; // ResolvedNumberOption
    baseUrl: NexusGenRootTypes['ResolvedStringOption'] | null; // ResolvedStringOption
    blockHosts: NexusGenRootTypes['ResolvedStringOption'] | null; // ResolvedStringOption
    chromeWebSecurity: NexusGenRootTypes['ResolvedBooleanOption'] | null; // ResolvedBooleanOption
    component: NexusGenRootTypes['ResolvedConfig'] | null; // ResolvedConfig
    componentFolder: NexusGenRootTypes['ResolvedStringOption'] | null; // ResolvedStringOption
    defaultCommandTimeout: NexusGenRootTypes['ResolvedNumberOption'] | null; // ResolvedNumberOption
    downloadsFolder: NexusGenRootTypes['ResolvedStringOption'] | null; // ResolvedStringOption
    e2e: NexusGenRootTypes['ResolvedConfig'] | null; // ResolvedConfig
    env: NexusGenRootTypes['ResolvedJsonOption'] | null; // ResolvedJsonOption
    execTimeout: NexusGenRootTypes['ResolvedNumberOption'] | null; // ResolvedNumberOption
    experimentalFetchPolyfill: NexusGenRootTypes['ResolvedBooleanOption'] | null; // ResolvedBooleanOption
    experimentalInteractiveRunEvents: NexusGenRootTypes['ResolvedBooleanOption'] | null; // ResolvedBooleanOption
    experimentalSessionSupport: NexusGenRootTypes['ResolvedBooleanOption'] | null; // ResolvedBooleanOption
    experimentalSourceRewriting: NexusGenRootTypes['ResolvedBooleanOption'] | null; // ResolvedBooleanOption
    experimentalStudio: NexusGenRootTypes['ResolvedBooleanOption'] | null; // ResolvedBooleanOption
    fileServerFolder: NexusGenRootTypes['ResolvedStringOption'] | null; // ResolvedStringOption
    fixturesFolder: NexusGenRootTypes['ResolvedStringOption'] | null; // ResolvedStringOption
    ignoreTestFiles: NexusGenRootTypes['ResolvedStringListOption'] | null; // ResolvedStringListOption
    includeShadowDom: NexusGenRootTypes['ResolvedBooleanOption'] | null; // ResolvedBooleanOption
    integrationFolder: NexusGenRootTypes['ResolvedStringOption'] | null; // ResolvedStringOption
    nodeVersion: NexusGenRootTypes['ResolvedStringOption'] | null; // ResolvedStringOption
    numTestsKeptInMemory: NexusGenRootTypes['ResolvedNumberOption'] | null; // ResolvedNumberOption
    pageLoadTimeout: NexusGenRootTypes['ResolvedNumberOption'] | null; // ResolvedNumberOption
    pluginsFile: NexusGenRootTypes['ResolvedStringOption'] | null; // ResolvedStringOption
    port: NexusGenRootTypes['ResolvedNumberOption'] | null; // ResolvedNumberOption
    projectId: NexusGenRootTypes['ResolvedStringOption'] | null; // ResolvedStringOption
    redirectionLimit: NexusGenRootTypes['ResolvedNumberOption'] | null; // ResolvedNumberOption
    reporter: NexusGenRootTypes['ResolvedStringOption'] | null; // ResolvedStringOption
    requestTimeout: NexusGenRootTypes['ResolvedNumberOption'] | null; // ResolvedNumberOption
    resolvedNodePath: NexusGenRootTypes['ResolvedStringOption'] | null; // ResolvedStringOption
    resolvedNodeVersion: NexusGenRootTypes['ResolvedStringOption'] | null; // ResolvedStringOption
    retries: NexusGenRootTypes['ResolvedNumberOption'] | null; // ResolvedNumberOption
    screenshotOnRunFailure: NexusGenRootTypes['ResolvedBooleanOption'] | null; // ResolvedBooleanOption
    screenshotsFolder: NexusGenRootTypes['ResolvedStringOption'] | null; // ResolvedStringOption
    scrollBehavior: NexusGenRootTypes['ResolvedStringOption'] | null; // ResolvedStringOption
    supportFile: NexusGenRootTypes['ResolvedStringOption'] | null; // ResolvedStringOption
    supportFolder: NexusGenRootTypes['ResolvedStringOption'] | null; // ResolvedStringOption
    taskTimeout: NexusGenRootTypes['ResolvedNumberOption'] | null; // ResolvedNumberOption
    testFiles: NexusGenRootTypes['ResolvedStringOption'] | null; // ResolvedStringOption
    trashAssetsBeforeRuns: NexusGenRootTypes['ResolvedBooleanOption'] | null; // ResolvedBooleanOption
    userAgent: NexusGenRootTypes['ResolvedStringOption'] | null; // ResolvedStringOption
    video: NexusGenRootTypes['ResolvedBooleanOption'] | null; // ResolvedBooleanOption
    videoCompression: NexusGenRootTypes['ResolvedNumberOption'] | null; // ResolvedNumberOption
    videoUploadOnPasses: NexusGenRootTypes['ResolvedBooleanOption'] | null; // ResolvedBooleanOption
    videosFolder: NexusGenRootTypes['ResolvedStringOption'] | null; // ResolvedStringOption
    viewportHeight: NexusGenRootTypes['ResolvedNumberOption'] | null; // ResolvedNumberOption
    viewportWidth: NexusGenRootTypes['ResolvedNumberOption'] | null; // ResolvedNumberOption
    waitForAnimations: NexusGenRootTypes['ResolvedBooleanOption'] | null; // ResolvedBooleanOption
    watchForFileChanges: NexusGenRootTypes['ResolvedBooleanOption'] | null; // ResolvedBooleanOption
  }
  ResolvedJsonOption: { // field return type
    from: NexusGenEnums['ResolvedConfigOption'] | null; // ResolvedConfigOption
    type: NexusGenEnums['ResolvedType']; // ResolvedType!
    value: string | null; // String
  }
  ResolvedNumberOption: { // field return type
    from: NexusGenEnums['ResolvedConfigOption'] | null; // ResolvedConfigOption
    type: NexusGenEnums['ResolvedType']; // ResolvedType!
    value: string | null; // String
  }
  ResolvedStringListOption: { // field return type
    from: NexusGenEnums['ResolvedConfigOption'] | null; // ResolvedConfigOption
    type: NexusGenEnums['ResolvedType']; // ResolvedType!
    value: Array<string | null> | null; // [String]
  }
  ResolvedStringOption: { // field return type
    from: NexusGenEnums['ResolvedConfigOption'] | null; // ResolvedConfigOption
    type: NexusGenEnums['ResolvedType']; // ResolvedType!
    value: string | null; // String
  }
  TestingTypeInfo: { // field return type
    description: string; // String!
    id: NexusGenEnums['TestingTypeEnum']; // TestingTypeEnum!
    title: string; // String!
  }
  Wizard: { // field return type
    allBundlers: NexusGenRootTypes['WizardBundler'][]; // [WizardBundler!]!
    bundler: NexusGenRootTypes['WizardBundler'] | null; // WizardBundler
    canNavigateForward: boolean; // Boolean!
    description: string | null; // String
    framework: NexusGenRootTypes['WizardFrontendFramework'] | null; // WizardFrontendFramework
    frameworks: NexusGenRootTypes['WizardFrontendFramework'][]; // [WizardFrontendFramework!]!
    isManualInstall: boolean; // Boolean!
    packagesToInstall: NexusGenRootTypes['WizardNpmPackage'][] | null; // [WizardNpmPackage!]
    sampleCode: string | null; // String
    step: NexusGenEnums['WizardStep']; // WizardStep!
    testingType: NexusGenEnums['TestingTypeEnum'] | null; // TestingTypeEnum
    testingTypes: NexusGenRootTypes['TestingTypeInfo'][]; // [TestingTypeInfo!]!
    title: string | null; // String
  }
  WizardBundler: { // field return type
    id: NexusGenEnums['SupportedBundlers']; // SupportedBundlers!
    isSelected: boolean | null; // Boolean
    name: string; // String!
    package: string; // String!
  }
  WizardFrontendFramework: { // field return type
    id: NexusGenEnums['FrontendFramework']; // FrontendFramework!
    isSelected: boolean; // Boolean!
    name: string; // String!
    supportedBundlers: NexusGenRootTypes['WizardBundler'][]; // [WizardBundler!]!
  }
  WizardNpmPackage: { // field return type
    description: string; // String!
    name: string; // String!
  }
  Node: { // field return type
    id: string; // ID!
  }
  ResolvedOptionBase: { // field return type
    from: NexusGenEnums['ResolvedConfigOption'] | null; // ResolvedConfigOption
    type: NexusGenEnums['ResolvedType']; // ResolvedType!
  }
}

export interface NexusGenFieldTypeNames {
  App: { // field return type name
    activeProject: 'Project'
    browsers: 'Browser'
    isFirstOpen: 'Boolean'
    projects: 'Project'
  }
  Browser: { // field return type name
    channel: 'String'
    displayName: 'String'
    family: 'BrowserFamily'
    id: 'String'
    majorVersion: 'String'
    name: 'String'
    path: 'String'
    version: 'String'
  }
  CloudOrganization: { // field return type name
    id: 'ID'
    name: 'String'
    projects: 'CloudProjectConnection'
  }
  CloudOrganizationConnection: { // field return type name
    edges: 'CloudOrganizationEdge'
    nodes: 'CloudOrganization'
    pageInfo: 'PageInfo'
  }
  CloudOrganizationEdge: { // field return type name
    cursor: 'String'
    node: 'CloudOrganization'
  }
  CloudProject: { // field return type name
    id: 'ID'
    latestRun: 'CloudRun'
    organization: 'CloudOrganization'
    recordKeys: 'CloudRecordKey'
    runs: 'CloudRunConnection'
    slug: 'String'
  }
  CloudProjectConnection: { // field return type name
    edges: 'CloudProjectEdge'
    nodes: 'CloudProject'
    pageInfo: 'PageInfo'
  }
  CloudProjectEdge: { // field return type name
    cursor: 'String'
    node: 'CloudProject'
  }
  CloudRecordKey: { // field return type name
    createdAt: 'String'
    id: 'ID'
    key: 'String'
    lastUsedAt: 'String'
  }
  CloudRun: { // field return type name
    commitInfo: 'CloudRunCommitInfo'
    createdAt: 'Date'
    id: 'ID'
    status: 'CloudRunStatus'
    totalDuration: 'Int'
    totalFailed: 'Int'
    totalPassed: 'Int'
    totalPending: 'Int'
    totalRunning: 'Int'
    totalSkipped: 'Int'
    totalTests: 'Int'
  }
  CloudRunCommitInfo: { // field return type name
    authorAvatar: 'String'
    authorEmail: 'String'
    authorName: 'String'
    branch: 'String'
    branchUrl: 'String'
    message: 'String'
    sha: 'String'
    summary: 'String'
    url: 'String'
  }
  CloudRunConnection: { // field return type name
    edges: 'CloudRunEdge'
    nodes: 'CloudRun'
    pageInfo: 'PageInfo'
  }
  CloudRunEdge: { // field return type name
    cursor: 'String'
    node: 'CloudRun'
  }
  CloudUser: { // field return type name
    email: 'String'
    fullName: 'String'
    id: 'ID'
    organizations: 'CloudOrganizationConnection'
    userIsViewer: 'Boolean'
  }
  Mutation: { // field return type name
    appCreateConfigFile: 'App'
    initializeOpenProject: 'App'
    launchOpenProject: 'App'
    login: 'Query'
    logout: 'Query'
    navigationMenuSetItem: 'NavigationMenu'
    wizardInstallDependencies: 'Wizard'
    wizardNavigate: 'Wizard'
    wizardSetBundler: 'Wizard'
    wizardSetFramework: 'Wizard'
    wizardSetManualInstall: 'Wizard'
    wizardSetTestingType: 'Wizard'
    wizardValidateManualInstall: 'Wizard'
  }
  NavigationItem: { // field return type name
    iconPath: 'String'
    id: 'NavItem'
    name: 'String'
    selected: 'Boolean'
  }
  NavigationMenu: { // field return type name
    items: 'NavigationItem'
    selected: 'NavItem'
  }
  PageInfo: { // field return type name
    endCursor: 'String'
    hasNextPage: 'Boolean'
    hasPreviousPage: 'Boolean'
    startCursor: 'String'
  }
  Project: { // field return type name
    cloudProject: 'CloudProject'
    hasSetupComponentTesting: 'Boolean'
    hasSetupE2ETesting: 'Boolean'
    id: 'ID'
    projectId: 'String'
    projectRoot: 'String'
    resolvedConfig: 'ResolvedConfig'
    title: 'String'
  }
  Query: { // field return type name
    app: 'App'
    cloudNode: 'Node'
    cloudProjectBySlug: 'CloudProject'
    cloudProjectsBySlugs: 'CloudProject'
    cloudViewer: 'CloudUser'
    navigationMenu: 'NavigationMenu'
    wizard: 'Wizard'
  }
  ResolvedBooleanOption: { // field return type name
    from: 'ResolvedConfigOption'
    type: 'ResolvedType'
    value: 'Boolean'
  }
  ResolvedConfig: { // field return type name
    animationDistanceThreshold: 'ResolvedNumberOption'
    baseUrl: 'ResolvedStringOption'
    blockHosts: 'ResolvedStringOption'
    chromeWebSecurity: 'ResolvedBooleanOption'
    component: 'ResolvedConfig'
    componentFolder: 'ResolvedStringOption'
    defaultCommandTimeout: 'ResolvedNumberOption'
    downloadsFolder: 'ResolvedStringOption'
    e2e: 'ResolvedConfig'
    env: 'ResolvedJsonOption'
    execTimeout: 'ResolvedNumberOption'
    experimentalFetchPolyfill: 'ResolvedBooleanOption'
    experimentalInteractiveRunEvents: 'ResolvedBooleanOption'
    experimentalSessionSupport: 'ResolvedBooleanOption'
    experimentalSourceRewriting: 'ResolvedBooleanOption'
    experimentalStudio: 'ResolvedBooleanOption'
    fileServerFolder: 'ResolvedStringOption'
    fixturesFolder: 'ResolvedStringOption'
    ignoreTestFiles: 'ResolvedStringListOption'
    includeShadowDom: 'ResolvedBooleanOption'
    integrationFolder: 'ResolvedStringOption'
    nodeVersion: 'ResolvedStringOption'
    numTestsKeptInMemory: 'ResolvedNumberOption'
    pageLoadTimeout: 'ResolvedNumberOption'
    pluginsFile: 'ResolvedStringOption'
    port: 'ResolvedNumberOption'
    projectId: 'ResolvedStringOption'
    redirectionLimit: 'ResolvedNumberOption'
    reporter: 'ResolvedStringOption'
    requestTimeout: 'ResolvedNumberOption'
    resolvedNodePath: 'ResolvedStringOption'
    resolvedNodeVersion: 'ResolvedStringOption'
    retries: 'ResolvedNumberOption'
    screenshotOnRunFailure: 'ResolvedBooleanOption'
    screenshotsFolder: 'ResolvedStringOption'
    scrollBehavior: 'ResolvedStringOption'
    supportFile: 'ResolvedStringOption'
    supportFolder: 'ResolvedStringOption'
    taskTimeout: 'ResolvedNumberOption'
    testFiles: 'ResolvedStringOption'
    trashAssetsBeforeRuns: 'ResolvedBooleanOption'
    userAgent: 'ResolvedStringOption'
    video: 'ResolvedBooleanOption'
    videoCompression: 'ResolvedNumberOption'
    videoUploadOnPasses: 'ResolvedBooleanOption'
    videosFolder: 'ResolvedStringOption'
    viewportHeight: 'ResolvedNumberOption'
    viewportWidth: 'ResolvedNumberOption'
    waitForAnimations: 'ResolvedBooleanOption'
    watchForFileChanges: 'ResolvedBooleanOption'
  }
  ResolvedJsonOption: { // field return type name
    from: 'ResolvedConfigOption'
    type: 'ResolvedType'
    value: 'String'
  }
  ResolvedNumberOption: { // field return type name
    from: 'ResolvedConfigOption'
    type: 'ResolvedType'
    value: 'String'
  }
  ResolvedStringListOption: { // field return type name
    from: 'ResolvedConfigOption'
    type: 'ResolvedType'
    value: 'String'
  }
  ResolvedStringOption: { // field return type name
    from: 'ResolvedConfigOption'
    type: 'ResolvedType'
    value: 'String'
  }
  TestingTypeInfo: { // field return type name
    description: 'String'
    id: 'TestingTypeEnum'
    title: 'String'
  }
  Wizard: { // field return type name
    allBundlers: 'WizardBundler'
    bundler: 'WizardBundler'
    canNavigateForward: 'Boolean'
    description: 'String'
    framework: 'WizardFrontendFramework'
    frameworks: 'WizardFrontendFramework'
    isManualInstall: 'Boolean'
    packagesToInstall: 'WizardNpmPackage'
    sampleCode: 'String'
    step: 'WizardStep'
    testingType: 'TestingTypeEnum'
    testingTypes: 'TestingTypeInfo'
    title: 'String'
  }
  WizardBundler: { // field return type name
    id: 'SupportedBundlers'
    isSelected: 'Boolean'
    name: 'String'
    package: 'String'
  }
  WizardFrontendFramework: { // field return type name
    id: 'FrontendFramework'
    isSelected: 'Boolean'
    name: 'String'
    supportedBundlers: 'WizardBundler'
  }
  WizardNpmPackage: { // field return type name
    description: 'String'
    name: 'String'
  }
  Node: { // field return type name
    id: 'ID'
  }
  ResolvedOptionBase: { // field return type name
    from: 'ResolvedConfigOption'
    type: 'ResolvedType'
  }
}

export interface NexusGenArgTypes {
  CloudOrganization: {
    projects: { // args
      after?: string | null; // String
      before?: string | null; // String
      first?: number | null; // Int
      last?: number | null; // Int
    }
  }
  CloudProject: {
    runs: { // args
      after?: string | null; // String
      before?: string | null; // String
      cypressVersion: string; // String!
      first?: number | null; // Int
      last?: number | null; // Int
      status: NexusGenEnums['CloudRunStatus']; // CloudRunStatus!
    }
  }
  CloudRunCommitInfo: {
    message: { // args
      truncate?: number | null; // Int
    }
  }
  CloudUser: {
    organizations: { // args
      after?: string | null; // String
      before?: string | null; // String
      first?: number | null; // Int
      last?: number | null; // Int
    }
  }
  Mutation: {
    appCreateConfigFile: { // args
      code: string; // String!
      configFilename: string; // String!
    }
    initializeOpenProject: { // args
      testingType: NexusGenEnums['TestingTypeEnum']; // TestingTypeEnum!
    }
    launchOpenProject: { // args
      testingType: NexusGenEnums['TestingTypeEnum']; // TestingTypeEnum!
    }
    navigationMenuSetItem: { // args
      type: NexusGenEnums['NavItem']; // NavItem!
    }
    wizardNavigate: { // args
      direction: NexusGenEnums['WizardNavigateDirection']; // WizardNavigateDirection!
    }
    wizardSetBundler: { // args
      bundler: NexusGenEnums['SupportedBundlers']; // SupportedBundlers!
    }
    wizardSetFramework: { // args
      framework: NexusGenEnums['FrontendFramework']; // FrontendFramework!
    }
    wizardSetManualInstall: { // args
      isManual: boolean; // Boolean!
    }
    wizardSetTestingType: { // args
      type: NexusGenEnums['TestingTypeEnum']; // TestingTypeEnum!
    }
  }
  Query: {
    cloudNode: { // args
      id: string; // ID!
    }
    cloudProjectBySlug: { // args
      slug: string; // String!
    }
    cloudProjectsBySlugs: { // args
      slugs: string[]; // [String!]!
    }
  }
  Wizard: {
    sampleCode: { // args
      lang: NexusGenEnums['WizardCodeLanguage']; // WizardCodeLanguage!
    }
  }
}

export interface NexusGenAbstractTypeMembers {
  Node: "CloudOrganization" | "CloudProject" | "CloudRecordKey" | "CloudRun" | "CloudUser"
  ResolvedOptionBase: "ResolvedBooleanOption" | "ResolvedJsonOption" | "ResolvedNumberOption" | "ResolvedStringListOption" | "ResolvedStringOption"
}

export interface NexusGenTypeInterfaces {
  CloudOrganization: "Node"
  CloudProject: "Node"
  CloudRecordKey: "Node"
  CloudRun: "Node"
  CloudUser: "Node"
  ResolvedBooleanOption: "ResolvedOptionBase"
  ResolvedJsonOption: "ResolvedOptionBase"
  ResolvedNumberOption: "ResolvedOptionBase"
  ResolvedStringListOption: "ResolvedOptionBase"
  ResolvedStringOption: "ResolvedOptionBase"
}

export type NexusGenObjectNames = keyof NexusGenObjects;

export type NexusGenInputNames = never;

export type NexusGenEnumNames = keyof NexusGenEnums;

export type NexusGenInterfaceNames = keyof NexusGenInterfaces;

export type NexusGenScalarNames = keyof NexusGenScalars;

export type NexusGenUnionNames = never;

export type NexusGenObjectsUsingAbstractStrategyIsTypeOf = never;

export type NexusGenAbstractsUsingStrategyResolveType = "Node";

export type NexusGenFeaturesConfig = {
  abstractTypeStrategies: {
    isTypeOf: false
    resolveType: true
    __typename: false
  }
}

export interface NexusGenTypes {
  context: BaseContext;
  inputTypes: NexusGenInputs;
  rootTypes: NexusGenRootTypes;
  inputTypeShapes: NexusGenInputs & NexusGenEnums & NexusGenScalars;
  argTypes: NexusGenArgTypes;
  fieldTypes: NexusGenFieldTypes;
  fieldTypeNames: NexusGenFieldTypeNames;
  allTypes: NexusGenAllTypes;
  typeInterfaces: NexusGenTypeInterfaces;
  objectNames: NexusGenObjectNames;
  inputNames: NexusGenInputNames;
  enumNames: NexusGenEnumNames;
  interfaceNames: NexusGenInterfaceNames;
  scalarNames: NexusGenScalarNames;
  unionNames: NexusGenUnionNames;
  allInputTypes: NexusGenTypes['inputNames'] | NexusGenTypes['enumNames'] | NexusGenTypes['scalarNames'];
  allOutputTypes: NexusGenTypes['objectNames'] | NexusGenTypes['enumNames'] | NexusGenTypes['unionNames'] | NexusGenTypes['interfaceNames'] | NexusGenTypes['scalarNames'];
  allNamedTypes: NexusGenTypes['allInputTypes'] | NexusGenTypes['allOutputTypes']
  abstractTypes: NexusGenTypes['interfaceNames'] | NexusGenTypes['unionNames'];
  abstractTypeMembers: NexusGenAbstractTypeMembers;
  objectsUsingAbstractStrategyIsTypeOf: NexusGenObjectsUsingAbstractStrategyIsTypeOf;
  abstractsUsingStrategyResolveType: NexusGenAbstractsUsingStrategyResolveType;
  features: NexusGenFeaturesConfig;
}


declare global {
  interface NexusGenPluginTypeConfig<TypeName extends string> {
  }
  interface NexusGenPluginInputTypeConfig<TypeName extends string> {
  }
  interface NexusGenPluginFieldConfig<TypeName extends string, FieldName extends string> {
  }
  interface NexusGenPluginInputFieldConfig<TypeName extends string, FieldName extends string> {
  }
  interface NexusGenPluginSchemaConfig {
  }
  interface NexusGenPluginArgConfig {
  }
}