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
}

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

/** Mutations for the Cypress Cloud */
export interface Mutation {
  __typename: 'Mutation';
  /** Adding as a test */
  test?: Maybe<Scalars['Boolean']>;
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

export interface Query {
  __typename: 'Query';
  /** Returns an object conforming to the Relay spec */
  cloudNode?: Maybe<Node>;
  /** Lookup an individual project by the slug */
  cloudProjectBySlug?: Maybe<CloudProject>;
  /** Lookup a list of projects by their slug */
  cloudProjectsBySlugs?: Maybe<Array<Maybe<CloudProject>>>;
  /** A user within the Cypress Cloud */
  cloudViewer?: Maybe<CloudUser>;
}


export interface QueryCloudNodeArgs {
  id: Scalars['ID'];
}


export interface QueryCloudProjectBySlugArgs {
  slug: Scalars['String'];
}


export interface QueryCloudProjectsBySlugsArgs {
  slugs: Array<Scalars['String']>;
}

export interface CodegenTypeMap {
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
  Mutation: Mutation,
  Node: Node,
  PageInfo: PageInfo,
  Query: Query,
}
