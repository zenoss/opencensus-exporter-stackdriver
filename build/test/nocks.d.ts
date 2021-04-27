/**
 * Copyright 2016 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import * as nock from 'nock';
export declare function oauth2<T extends {} = {}>(validator?: (body: T) => boolean): nock.Scope;
export declare function projectId(status: number | (() => string), reply?: () => string): nock.Scope;
export declare function noDetectResource(): nock.Scope[];
export declare function detectGceResource(): nock.Scope;
export declare function instanceId(status: number | (() => string), reply?: () => string): nock.Scope;
export declare function hostname(status: number | (() => string), reply?: () => string): nock.Scope;
export declare function batchWrite<T extends {} = {}>(project: string, validator?: (body: T) => boolean, reply?: () => string, withError?: boolean): nock.Scope;
export declare function timeSeries<T extends {} = {}>(project: string, validator?: (body: T) => boolean, reply?: () => string, withError?: boolean): nock.Scope;
export declare function metricDescriptors<T extends {} = {}>(project: string, validator?: (body: T) => boolean, reply?: () => string, withError?: boolean): nock.Scope;
