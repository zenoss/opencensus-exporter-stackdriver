"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.metricDescriptors = exports.timeSeries = exports.batchWrite = exports.hostname = exports.instanceId = exports.detectGceResource = exports.noDetectResource = exports.projectId = exports.oauth2 = void 0;
const nock = require("nock");
// Original file from Stackdriver Trace Agent for Node.js
// https://github.com/GoogleCloudPlatform/cloud-trace-nodejs/blob/master/test/nocks.ts
const accept = () => true;
const HEADERS = {
    ['metadata-flavor']: 'Google',
};
const HOST_ADDRESS = 'http://metadata.google.internal.';
const SECONDARY_HOST_ADDRESS = 'http://169.254.169.254';
function oauth2(validator) {
    validator = validator || accept;
    return nock(/https:\/\/(accounts\.google\.com|www\.googleapis\.com)/)
        .persist()
        .post(/\/oauth2.*token/, validator)
        .reply(200, {
        refresh_token: 'hello',
        access_token: 'goodbye',
        expiry_date: new Date(9999, 1, 1),
    });
}
exports.oauth2 = oauth2;
function projectId(status, reply) {
    if (typeof status === 'function') {
        reply = status;
        status = 200;
    }
    return nock(HOST_ADDRESS)
        .get('/computeMetadata/v1/project/project-id')
        .once()
        .reply(status, reply, { 'Metadata-Flavor': 'Google' });
}
exports.projectId = projectId;
function noDetectResource() {
    const scopes = [
        nock(HOST_ADDRESS)
            .get('/computeMetadata/v1/instance')
            .once()
            .replyWithError({ code: 'ENOTFOUND' }),
        nock(SECONDARY_HOST_ADDRESS)
            .get('/computeMetadata/v1/instance')
            .once()
            .replyWithError({ code: 'ENOTFOUND' }),
        nock('http://169.254.169.254/latest/dynamic/instance-identity/document')
            .get('')
            .replyWithError({ code: 'ENOTFOUND' }),
    ];
    return scopes;
}
exports.noDetectResource = noDetectResource;
function detectGceResource() {
    return nock(HOST_ADDRESS)
        .get('/computeMetadata/v1/instance')
        .reply(200, {}, HEADERS)
        .get('/computeMetadata/v1/project/project-id')
        .reply(200, () => 'my-project-id', HEADERS)
        .get('/computeMetadata/v1/instance/zone')
        .reply(200, () => 'project/zone/my-zone', HEADERS)
        .get('/computeMetadata/v1/instance/id')
        .reply(200, () => 4520031799277581759, HEADERS);
}
exports.detectGceResource = detectGceResource;
function instanceId(status, reply) {
    if (typeof status === 'function') {
        reply = status;
        status = 200;
    }
    return nock(HOST_ADDRESS)
        .get('/computeMetadata/v1/instance/id')
        .once()
        .reply(status, reply, { 'Metadata-Flavor': 'Google' });
}
exports.instanceId = instanceId;
function hostname(status, reply) {
    if (typeof status === 'function') {
        reply = status;
        status = 200;
    }
    return nock(HOST_ADDRESS)
        .get('/computeMetadata/v1/instance/hostname')
        .once()
        .reply(status, reply, { 'Metadata-Flavor': 'Google' });
}
exports.hostname = hostname;
function batchWrite(project, validator, reply, withError) {
    validator = validator || accept;
    const interceptor = nock('https://cloudtrace.googleapis.com').post('/v2/projects/' + project + '/traces:batchWrite', validator);
    return reply ? interceptor.reply(reply) : interceptor.reply(200);
}
exports.batchWrite = batchWrite;
function timeSeries(project, validator, reply, withError) {
    validator = validator || accept;
    const interceptor = nock('https://monitoring.googleapis.com').post('/v3/projects/' + project + '/timeSeries', validator);
    return reply ? interceptor.reply(reply) : interceptor.reply(200);
}
exports.timeSeries = timeSeries;
function metricDescriptors(project, validator, reply, withError) {
    validator = validator || accept;
    const interceptor = nock('https://monitoring.googleapis.com').post('/v3/projects/' + project + '/metricDescriptors', validator);
    return reply ? interceptor.reply(reply) : interceptor.reply(200);
}
exports.metricDescriptors = metricDescriptors;
//# sourceMappingURL=nocks.js.map