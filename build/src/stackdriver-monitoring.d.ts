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
import { Logger, Measurement, StatsEventListener, TagKey, TagValue, View } from '@opencensus/core';
import { StackdriverExporterOptions } from './types';
/** Format and sends Stats to Stackdriver */
export declare class StackdriverStatsExporter implements StatsEventListener {
    private period;
    private projectId;
    private metricPrefix;
    private displayNamePrefix;
    private onMetricUploadError?;
    private timer;
    static readonly DEFAULT_DISPLAY_NAME_PREFIX: string;
    static readonly CUSTOM_OPENCENSUS_DOMAIN: string;
    static readonly PERIOD: number;
    private registeredMetricDescriptors;
    private DEFAULT_RESOURCE;
    logger: Logger;
    constructor(options: StackdriverExporterOptions);
    /**
     * Creates a Stackdriver Stats exporter with a StackdriverExporterOptions.
     */
    start(): void;
    /**
     * Polls MetricProducerManager from Metrics library for all registered
     * MetricDescriptors, and upload them as TimeSeries to StackDriver.
     */
    export(): Promise<void>;
    /**
     * Returns true if the given metricDescriptor is successfully registered to
     * Stackdriver Monitoring, or the exact same metric has already been
     * registered. Returns false otherwise.
     * @param metricDescriptor The OpenCensus MetricDescriptor.
     */
    private registerMetricDescriptor;
    /**
     * Converts metric's timeseries to a list of TimeSeries, so that metric can
     * be uploaded to StackDriver.
     * @param metricsList The List of Metric.
     */
    private createTimeSeries;
    /**
     * Creates a new metric descriptor.
     * @param metricDescriptor The OpenCensus MetricDescriptor.
     */
    private createMetricDescriptor;
    /**
     * Clear the interval timer to stop uploading metrics. It should be called
     * whenever the exporter is not needed anymore.
     */
    stop(): void;
    /**
     * Gets the Google Application Credentials from the environment variables
     * and authenticates the client.
     */
    private authorize;
    /**
     * Is called whenever a view is registered.
     * @param view The registered view.
     */
    onRegisterView(view: View): void;
    /**
     * Is called whenever a measure is recorded.
     * @param views The views related to the measurement
     * @param measurement The recorded measurement
     * @param tags The tags to which the value is applied
     */
    onRecord(views: View[], measurement: Measurement, tags: Map<TagKey, TagValue>): void;
}
