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

import {
  logger,
  Logger,
  Measurement,
  Metric,
  MetricDescriptor as OCMetricDescriptor,
  MetricProducerManager,
  Metrics,
  StatsEventListener,
  TagKey,
  TagValue,
  version,
  View,
} from '@opencensus/core';
import { auth as globalAuth, GoogleAuth, JWT } from 'google-auth-library';
import { google } from 'googleapis';
import { getDefaultResource } from './common-utils';
import {
  createMetricDescriptorData,
  createTimeSeriesList,
} from './stackdriver-monitoring-utils';
import {
  MonitoredResource,
  StackdriverExporterOptions,
  TimeSeries,
} from './types';

const OC_USER_AGENT = {
  product: 'opencensus-node',
  version,
};
const OC_HEADER = {
  'x-opencensus-outgoing-request': 0x1,
};
const STACKDRIVER_TIMESERIES_LIMIT = 200;

google.options({ headers: OC_HEADER });
const monitoring = google.monitoring('v3');
let auth = globalAuth;

/** Format and sends Stats to Stackdriver */
export class StackdriverStatsExporter implements StatsEventListener {
  private period: number;
  private projectId: string;
  private metricPrefix: string;
  private displayNamePrefix: string;
  private onMetricUploadError?: (err: Error) => void;
  private timer!: NodeJS.Timer;
  static readonly DEFAULT_DISPLAY_NAME_PREFIX: string = 'OpenCensus';
  static readonly CUSTOM_OPENCENSUS_DOMAIN: string =
    'custom.googleapis.com/opencensus';
  static readonly PERIOD: number = 60000;
  private registeredMetricDescriptors: Map<
    string,
    OCMetricDescriptor
  > = new Map();
  private DEFAULT_RESOURCE: Promise<MonitoredResource>;
  logger: Logger;

  constructor(options: StackdriverExporterOptions) {
    this.period =
      options.period !== undefined
        ? options.period
        : StackdriverStatsExporter.PERIOD;
    this.projectId = options.projectId;
    this.metricPrefix =
      options.prefix || StackdriverStatsExporter.CUSTOM_OPENCENSUS_DOMAIN;
    this.displayNamePrefix =
      options.prefix || StackdriverStatsExporter.DEFAULT_DISPLAY_NAME_PREFIX;
    this.logger = options.logger || logger.logger();
    if (options.onMetricUploadError) {
      this.onMetricUploadError = options.onMetricUploadError;
    }
    this.DEFAULT_RESOURCE = getDefaultResource(this.projectId);
    if (options.credentials) {
      auth = new GoogleAuth({
        credentials: options.credentials,
        scopes: ['https://www.googleapis.com/auth/cloud-platform'],
      });
    }
  }

  /**
   * Creates a Stackdriver Stats exporter with a StackdriverExporterOptions.
   */
  start(): void {
    this.logger.debug("start")
    this.timer = setInterval(async () => {
      try {
        await this.export();
      } catch (err) {
        if (typeof this.onMetricUploadError === 'function') {
          this.onMetricUploadError(err);
        }
      }
    }, this.period);
  }

  /**
   * Polls MetricProducerManager from Metrics library for all registered
   * MetricDescriptors, and upload them as TimeSeries to StackDriver.
   */
  async export() {
    this.logger.debug("export()")
    const metricsList: Metric[] = [];
    const metricProducerManager: MetricProducerManager = Metrics.getMetricProducerManager();
    this.logger.debug(`export(): metricProducerManager.getAllMetricProducer(): ${metricProducerManager.getAllMetricProducer().values()}`)

    for (const metricProducer of metricProducerManager.getAllMetricProducer()) {
      this.logger.debug(`export(): metricProducer.getMetrics(): ${JSON.stringify(metricProducer.getMetrics())}`)
      for (const metric of metricProducer.getMetrics()) {
        // TODO(mayurkale): OPTIMIZATION: consider to call in parallel.
        const isRegistered = await this.registerMetricDescriptor(
          metric.descriptor
        );
        if (metric && isRegistered) {
          metricsList.push(metric);
        }
      }
    }

    this.createTimeSeries(metricsList);
  }

  /**
   * Returns true if the given metricDescriptor is successfully registered to
   * Stackdriver Monitoring, or the exact same metric has already been
   * registered. Returns false otherwise.
   * @param metricDescriptor The OpenCensus MetricDescriptor.
   */
  private async registerMetricDescriptor(metricDescriptor: OCMetricDescriptor) {
    this.logger.debug(`registerMetricDescriptor(metricDescriptor_name = ${metricDescriptor.name})`)
    const existingMetricDescriptor = this.registeredMetricDescriptors.get(
      metricDescriptor.name
    );

    if (existingMetricDescriptor) {
      if (existingMetricDescriptor === metricDescriptor) {
        // Ignore metricDescriptor that are already registered.
        return true;
      } else {
        this.logger.warn(
          `A different metric with the same name is already registered: ${existingMetricDescriptor}`
        );
        return false;
      }
    }
    const isRegistered = await this.createMetricDescriptor(metricDescriptor)
      .then(() => {
        this.registeredMetricDescriptors.set(
          metricDescriptor.name,
          metricDescriptor
        );
        return true;
      })
      .catch(err => {
        this.logger.error(err);
        return false;
      });
    return isRegistered;
  }

  /**
   * Converts metric's timeseries to a list of TimeSeries, so that metric can
   * be uploaded to StackDriver.
   * @param metricsList The List of Metric.
   */
  private async createTimeSeries(metricsList: Metric[]) {
    this.logger.debug(`createTimeSeries(metricsList_lenght = ${metricsList.length})`)
    const timeSeries: TimeSeries[] = [];
    const monitoredResource = await this.DEFAULT_RESOURCE;
    for (const metric of metricsList) {
      timeSeries.push(
        ...createTimeSeriesList(metric, monitoredResource, this.metricPrefix)
      );
    }

    if (timeSeries.length === 0) {
      this.logger.warn(`createTimeSeries(): timeSeries is of 0 length`)
      return Promise.resolve();
    }

    return this.authorize().then(authClient => {
      const promises: Promise<void>[] = [];
      let chunkIndex: number = 0;
      while (chunkIndex < timeSeries.length) {
        const request = {
          name: `projects/${this.projectId}`,
          resource: { timeSeries: timeSeries.slice(chunkIndex, chunkIndex + STACKDRIVER_TIMESERIES_LIMIT) },
          auth: authClient,
        };

        promises.push(
          new Promise<void>((resolve, reject) => {
            monitoring.projects.timeSeries.create(
              request,
              { headers: OC_HEADER, userAgentDirectives: [OC_USER_AGENT] },
              (err: Error | null) => {
                this.logger.debug('sent time series', request.resource.timeSeries);
                err ? reject(err) : resolve();
              }
            );
          })
        );

        chunkIndex += STACKDRIVER_TIMESERIES_LIMIT;
      }

      return Promise.allSettled(promises);
    });
  }

  /**
   * Creates a new metric descriptor.
   * @param metricDescriptor The OpenCensus MetricDescriptor.
   */
  private createMetricDescriptor(metricDescriptor: OCMetricDescriptor) {
    this.logger.debug(`createMetricDescriptor(metricDescriptor_name = ${metricDescriptor.name})`)
    return this.authorize().then(authClient => {
      const request = {
        name: `projects/${this.projectId}`,
        resource: createMetricDescriptorData(
          metricDescriptor,
          this.metricPrefix,
          this.displayNamePrefix
        ),
        auth: authClient,
      };

      this.logger.info(`projectId = ${this.projectId}`)
      this.logger.info(`metricPrefix = ${this.metricPrefix}`)
      this.logger.info(`displayNamePrefix = ${this.displayNamePrefix}`)

      return new Promise<void>((resolve, reject) => {
        this.logger.info(`BEFORE:::::monitoring.projects.metricDescriptors.create()`)
        monitoring.projects.metricDescriptors.create(
          request,
          { headers: OC_HEADER, userAgentDirectives: [OC_USER_AGENT] },
          (err: Error | null) => {
            // this.logger.error(`RESPONSE: ${JSON.stringify(res)}`)
            this.logger.debug('sent metric descriptor!', request.resource);
            err ? reject(err) : resolve();
          }
        );
        this.logger.info(`AFTER:::::monitoring.projects.metricDescriptors.create()`)
      }).catch(err => {
        this.logger.error(
          `StackdriverStatsExporter: Failed to write data: ${err.message}`
        );
        this.stop();
      });
    });
  }

  /**
   * Clear the interval timer to stop uploading metrics. It should be called
   * whenever the exporter is not needed anymore.
   */
  stop() {
    this.logger.info("stop")
    clearInterval(this.timer);
  }

  /**
   * Gets the Google Application Credentials from the environment variables
   * and authenticates the client.
   */
  private async authorize(): Promise<JWT> {
    this.logger.debug(`authrozie()`)
    const client = await auth.getClient();
    return client as JWT;
  }

  // TODO(mayurkale): Deprecate onRegisterView and onRecord apis after
  // https://github.com/census-instrumentation/opencensus-node/issues/257
  /**
   * Is called whenever a view is registered.
   * @param view The registered view.
   */
  onRegisterView(view: View) {
    this.logger.debug(`onRegisterView(view_name = ${view.name})`)
  }

  /**
   * Is called whenever a measure is recorded.
   * @param views The views related to the measurement
   * @param measurement The recorded measurement
   * @param tags The tags to which the value is applied
   */
  onRecord(
    views: View[],
    measurement: Measurement,
    tags: Map<TagKey, TagValue>
  ) {
    this.logger.debug(`onRecord(views = []${views.length}, measurement_name = ${measurement.measure.name}, tags = ${tags})`)
  }
}
