/**
 * This file should be deleted as soon as the serever
 * TODO: delete this file when ResolvedDevServerConfig.server is converted to closeServer
 */

/// <reference types="node" />
import * as cyUtilsHttp from 'http'
export = cyUtilsHttp
/**
 * namespace created to bridge nodeJs.http typings so that
 * we can type http Server in CT
 */
export as namespace cyUtilsHttp
