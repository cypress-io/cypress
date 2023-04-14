/*
 * Copyright The OpenTelemetry Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Resource } from '@opentelemetry/resources'
import type { DetectorSync, ResourceAttributes, IResource } from '@opentelemetry/resources'

/**
 * EnvDetectorSync can be used to detect the presence of and create a Resource
 * from the OTEL_RESOURCE_ATTRIBUTES environment variable.
 */
class CircleCiDetectorSync implements DetectorSync {
  /**
   * Returns a {@link Resource} populated with attributes from the
   * OTEL_RESOURCE_ATTRIBUTES environment variable. Note this is an async
   * function to conform to the Detector interface.
   *
   * @param config The resource detection config
   */
  detect (): IResource {
    const attributes: ResourceAttributes = {}

    const { CIRCLECI, CIRCLE_BRANCH, CIRCLE_JOB, CIRCLE_NODE_INDEX, CIRCLE_BUILD_URL, CIRCLE_BUILD_NUM, CIRCLE_SHA1, CIRCLE_PR_NUMBER } = process.env

    if (CIRCLECI) {
      attributes['ci.circle'] = CIRCLECI
      attributes['ci.branch'] = CIRCLE_BRANCH
      attributes['ci.job'] = CIRCLE_JOB
      attributes['ci.node'] = CIRCLE_NODE_INDEX
      attributes['ci.build-url'] = CIRCLE_BUILD_URL
      attributes['ci.build-number'] = CIRCLE_BUILD_NUM
      attributes['SHA1'] = CIRCLE_SHA1
      attributes['ci.pr-number'] = CIRCLE_PR_NUMBER
    }

    return new Resource(attributes)
  }
}

export const circleCiDetectorSync = new CircleCiDetectorSync()
