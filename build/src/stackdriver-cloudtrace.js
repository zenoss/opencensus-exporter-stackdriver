"use strict";
/**
 * Copyright 2018, OpenCensus Authors
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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StackdriverTraceExporter = void 0;
const core_1 = require("@opencensus/core");
const core_2 = require("@opencensus/core");
const google_auth_library_1 = require("google-auth-library");
const googleapis_1 = require("googleapis");
const common_utils_1 = require("./common-utils");
const stackdriver_cloudtrace_utils_1 = require("./stackdriver-cloudtrace-utils");
googleapis_1.google.options({ headers: { 'x-opencensus-outgoing-request': 0x1 } });
const cloudTrace = googleapis_1.google.cloudtrace('v2');
let auth = google_auth_library_1.auth;
/** Format and sends span information to Stackdriver */
class StackdriverTraceExporter {
    constructor(options) {
        this.failBuffer = [];
        this.projectId = options.projectId;
        this.logger = options.logger || core_2.logger.logger();
        this.exporterBuffer = new core_1.ExporterBuffer(this, options);
        this.RESOURCE_LABELS = stackdriver_cloudtrace_utils_1.getResourceLabels(common_utils_1.getDefaultResource(this.projectId));
        if (options.credentials) {
            auth = new google_auth_library_1.GoogleAuth({
                credentials: options.credentials,
                scopes: ['https://www.googleapis.com/auth/cloud-platform'],
            });
        }
    }
    /**
     * Is called whenever a span is ended.
     * @param span the ended span
     */
    onEndSpan(span) {
        // Add spans of a trace together when root is ended, skip non root spans.
        // translateSpan function will extract child spans from root.
        if (!span.isRootSpan())
            return;
        this.exporterBuffer.addToBuffer(span);
    }
    /** Not used for this exporter */
    onStartSpan(span) { }
    /**
     * Publishes a list of spans to Stackdriver.
     * @param spans The list of spans to transmit to Stackdriver
     */
    publish(spans) {
        return __awaiter(this, void 0, void 0, function* () {
            const spanList = yield this.translateSpan(spans);
            return this.authorize(spanList)
                .then((spans) => {
                return this.batchWriteSpans(spans);
            })
                .catch(err => {
                for (const span of spans) {
                    this.failBuffer.push(span.spanContext);
                }
                return err;
            });
        });
    }
    translateSpan(spans) {
        return __awaiter(this, void 0, void 0, function* () {
            const resourceLabel = yield this.RESOURCE_LABELS;
            const spanList = [];
            spans.forEach(span => {
                // RootSpan data
                spanList.push(this.createSpan(span, resourceLabel, span.numberOfChildren));
                span.spans.forEach(child => {
                    // Builds spans data
                    spanList.push(this.createSpan(child, resourceLabel));
                });
            });
            return spanList;
        });
    }
    createSpan(span, resourceLabels, numberOfChildren = 0) {
        const spanName = `projects/${this.projectId}/traces/${span.traceId}/spans/${span.id}`;
        const spanBuilder = {
            name: spanName,
            spanId: span.id,
            displayName: stackdriver_cloudtrace_utils_1.stringToTruncatableString(span.name),
            startTime: span.startTime.toISOString(),
            endTime: span.endTime.toISOString(),
            attributes: stackdriver_cloudtrace_utils_1.createAttributes(span.attributes, resourceLabels, span.droppedAttributesCount),
            timeEvents: stackdriver_cloudtrace_utils_1.createTimeEvents(span.annotations, span.messageEvents, span.droppedAnnotationsCount, span.droppedMessageEventsCount),
            links: stackdriver_cloudtrace_utils_1.createLinks(span.links, span.droppedLinksCount),
            status: { code: span.status.code },
            sameProcessAsParentSpan: !span.remoteParent,
            childSpanCount: numberOfChildren,
            stackTrace: undefined,
        };
        if (span.parentSpanId) {
            spanBuilder.parentSpanId = span.parentSpanId;
        }
        if (span.status.message && spanBuilder.status) {
            spanBuilder.status.message = span.status.message;
        }
        return spanBuilder;
    }
    /**
     * Sends new spans to new or existing traces in the Stackdriver format to the
     * service.
     * @param spans
     */
    batchWriteSpans(spans) {
        return new Promise((resolve, reject) => {
            // TODO: Consider to use gRPC call (BatchWriteSpansRequest) for sending
            // data to backend :
            // https://cloud.google.com/trace/docs/reference/v2/rpc/google.devtools.
            // cloudtrace.v2#google.devtools.cloudtrace.v2.TraceService
            cloudTrace.projects.traces.batchWrite(spans, (err) => {
                if (err) {
                    err.message = `batchWriteSpans error: ${err.message}`;
                    this.logger.error(err.message);
                    reject(err);
                }
                else {
                    const successMsg = 'batchWriteSpans successfully';
                    this.logger.debug(successMsg);
                    resolve(successMsg);
                }
            });
        });
    }
    /**
     * Gets the Google Application Credentials from the environment variables,
     * authenticates the client and calls a method to send the spans data.
     * @param stackdriverSpans The spans to export
     */
    authorize(stackdriverSpans) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const client = yield auth.getClient();
                return {
                    name: `projects/${this.projectId}`,
                    resource: { spans: stackdriverSpans },
                    auth: client,
                };
            }
            catch (err) {
                err.message = `authorize error: ${err.message}`;
                this.logger.error(err.message);
                throw err;
            }
        });
    }
}
exports.StackdriverTraceExporter = StackdriverTraceExporter;
//# sourceMappingURL=stackdriver-cloudtrace.js.map