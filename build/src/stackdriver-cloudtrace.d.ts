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
import { Exporter, ExporterBuffer, Span as OCSpan, SpanContext } from '@opencensus/core';
import { Logger } from '@opencensus/core';
import { Span, StackdriverExporterOptions } from './types';
/** Format and sends span information to Stackdriver */
export declare class StackdriverTraceExporter implements Exporter {
    projectId: string;
    exporterBuffer: ExporterBuffer;
    logger: Logger;
    failBuffer: SpanContext[];
    private RESOURCE_LABELS;
    constructor(options: StackdriverExporterOptions);
    /**
     * Is called whenever a span is ended.
     * @param span the ended span
     */
    onEndSpan(span: OCSpan): void;
    /** Not used for this exporter */
    onStartSpan(span: OCSpan): void;
    /**
     * Publishes a list of spans to Stackdriver.
     * @param spans The list of spans to transmit to Stackdriver
     */
    publish(spans: OCSpan[]): Promise<any>;
    translateSpan(spans: OCSpan[]): Promise<Span[]>;
    private createSpan;
    /**
     * Sends new spans to new or existing traces in the Stackdriver format to the
     * service.
     * @param spans
     */
    private batchWriteSpans;
    /**
     * Gets the Google Application Credentials from the environment variables,
     * authenticates the client and calls a method to send the spans data.
     * @param stackdriverSpans The spans to export
     */
    private authorize;
}
