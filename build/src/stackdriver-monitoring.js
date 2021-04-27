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
exports.StackdriverStatsExporter = void 0;
const core_1 = require("@opencensus/core");
const google_auth_library_1 = require("google-auth-library");
const googleapis_1 = require("googleapis");
const common_utils_1 = require("./common-utils");
const stackdriver_monitoring_utils_1 = require("./stackdriver-monitoring-utils");
const OC_USER_AGENT = {
    product: 'opencensus-node',
    version: core_1.version,
};
const OC_HEADER = {
    'x-opencensus-outgoing-request': 0x1,
};
const STACKDRIVER_TIMESERIES_LIMIT = 200;
googleapis_1.google.options({ headers: OC_HEADER });
const monitoring = googleapis_1.google.monitoring('v3');
let auth = google_auth_library_1.auth;
/** Format and sends Stats to Stackdriver */
class StackdriverStatsExporter {
    constructor(options) {
        this.registeredMetricDescriptors = new Map();
        this.period =
            options.period !== undefined
                ? options.period
                : StackdriverStatsExporter.PERIOD;
        this.projectId = options.projectId;
        this.metricPrefix =
            options.prefix || StackdriverStatsExporter.CUSTOM_OPENCENSUS_DOMAIN;
        this.displayNamePrefix =
            options.prefix || StackdriverStatsExporter.DEFAULT_DISPLAY_NAME_PREFIX;
        this.logger = options.logger || core_1.logger.logger();
        if (options.onMetricUploadError) {
            this.onMetricUploadError = options.onMetricUploadError;
        }
        this.DEFAULT_RESOURCE = common_utils_1.getDefaultResource(this.projectId);
        if (options.credentials) {
            auth = new google_auth_library_1.GoogleAuth({
                credentials: options.credentials,
                scopes: ['https://www.googleapis.com/auth/cloud-platform'],
            });
        }
    }
    /**
     * Creates a Stackdriver Stats exporter with a StackdriverExporterOptions.
     */
    start() {
        this.timer = setInterval(() => __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.export();
            }
            catch (err) {
                if (typeof this.onMetricUploadError === 'function') {
                    this.onMetricUploadError(err);
                }
            }
        }), this.period);
    }
    /**
     * Polls MetricProducerManager from Metrics library for all registered
     * MetricDescriptors, and upload them as TimeSeries to StackDriver.
     */
    export() {
        return __awaiter(this, void 0, void 0, function* () {
            const metricsList = [];
            const metricProducerManager = core_1.Metrics.getMetricProducerManager();
            for (const metricProducer of metricProducerManager.getAllMetricProducer()) {
                for (const metric of metricProducer.getMetrics()) {
                    // TODO(mayurkale): OPTIMIZATION: consider to call in parallel.
                    const isRegistered = yield this.registerMetricDescriptor(metric.descriptor);
                    if (metric && isRegistered) {
                        metricsList.push(metric);
                    }
                }
            }
            this.createTimeSeries(metricsList);
        });
    }
    /**
     * Returns true if the given metricDescriptor is successfully registered to
     * Stackdriver Monitoring, or the exact same metric has already been
     * registered. Returns false otherwise.
     * @param metricDescriptor The OpenCensus MetricDescriptor.
     */
    registerMetricDescriptor(metricDescriptor) {
        return __awaiter(this, void 0, void 0, function* () {
            const existingMetricDescriptor = this.registeredMetricDescriptors.get(metricDescriptor.name);
            if (existingMetricDescriptor) {
                if (existingMetricDescriptor === metricDescriptor) {
                    // Ignore metricDescriptor that are already registered.
                    return true;
                }
                else {
                    this.logger.warn(`A different metric with the same name is already registered: ${existingMetricDescriptor}`);
                    return false;
                }
            }
            const isRegistered = yield this.createMetricDescriptor(metricDescriptor)
                .then(() => {
                this.registeredMetricDescriptors.set(metricDescriptor.name, metricDescriptor);
                return true;
            })
                .catch(err => {
                this.logger.error(err);
                return false;
            });
            return isRegistered;
        });
    }
    /**
     * Converts metric's timeseries to a list of TimeSeries, so that metric can
     * be uploaded to StackDriver.
     * @param metricsList The List of Metric.
     */
    createTimeSeries(metricsList) {
        return __awaiter(this, void 0, void 0, function* () {
            const timeSeries = [];
            const monitoredResource = yield this.DEFAULT_RESOURCE;
            for (const metric of metricsList) {
                timeSeries.push(...stackdriver_monitoring_utils_1.createTimeSeriesList(metric, monitoredResource, this.metricPrefix));
            }
            if (timeSeries.length === 0) {
                return Promise.resolve();
            }
            return this.authorize().then(authClient => {
                const promises = [];
                let chunkIndex = 0;
                while (chunkIndex < timeSeries.length) {
                    const request = {
                        name: `projects/${this.projectId}`,
                        resource: { timeSeries: timeSeries.slice(chunkIndex, chunkIndex + STACKDRIVER_TIMESERIES_LIMIT) },
                        auth: authClient,
                    };
                    promises.push(new Promise((resolve, reject) => {
                        monitoring.projects.timeSeries.create(request, { headers: OC_HEADER, userAgentDirectives: [OC_USER_AGENT] }, (err) => {
                            this.logger.debug('sent time series', request.resource.timeSeries);
                            err ? reject(err) : resolve();
                        });
                    }));
                    chunkIndex += STACKDRIVER_TIMESERIES_LIMIT;
                }
                return Promise.allSettled(promises);
            });
        });
    }
    /**
     * Creates a new metric descriptor.
     * @param metricDescriptor The OpenCensus MetricDescriptor.
     */
    createMetricDescriptor(metricDescriptor) {
        return this.authorize().then(authClient => {
            const request = {
                name: `projects/${this.projectId}`,
                resource: stackdriver_monitoring_utils_1.createMetricDescriptorData(metricDescriptor, this.metricPrefix, this.displayNamePrefix),
                auth: authClient,
            };
            return new Promise((resolve, reject) => {
                monitoring.projects.metricDescriptors.create(request, { headers: OC_HEADER, userAgentDirectives: [OC_USER_AGENT] }, (err) => {
                    this.logger.debug('sent metric descriptor', request.resource);
                    err ? reject(err) : resolve();
                });
            }).catch(err => {
                this.logger.error(`StackdriverStatsExporter: Failed to write data: ${err.message}`);
                this.stop();
            });
        });
    }
    /**
     * Clear the interval timer to stop uploading metrics. It should be called
     * whenever the exporter is not needed anymore.
     */
    stop() {
        clearInterval(this.timer);
    }
    /**
     * Gets the Google Application Credentials from the environment variables
     * and authenticates the client.
     */
    authorize() {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield auth.getClient();
            return client;
        });
    }
    // TODO(mayurkale): Deprecate onRegisterView and onRecord apis after
    // https://github.com/census-instrumentation/opencensus-node/issues/257
    /**
     * Is called whenever a view is registered.
     * @param view The registered view.
     */
    onRegisterView(view) { }
    /**
     * Is called whenever a measure is recorded.
     * @param views The views related to the measurement
     * @param measurement The recorded measurement
     * @param tags The tags to which the value is applied
     */
    onRecord(views, measurement, tags) { }
}
exports.StackdriverStatsExporter = StackdriverStatsExporter;
StackdriverStatsExporter.DEFAULT_DISPLAY_NAME_PREFIX = 'OpenCensus';
StackdriverStatsExporter.CUSTOM_OPENCENSUS_DOMAIN = 'custom.googleapis.com/opencensus';
StackdriverStatsExporter.PERIOD = 60000;
//# sourceMappingURL=stackdriver-monitoring.js.map