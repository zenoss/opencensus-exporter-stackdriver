/**
 * Copyright 2019, OpenCensus Authors
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
import { BucketOptions, DistributionBucket, DistributionValue, LabelKey, LabelValue, Metric, MetricDescriptor as OCMetricDescriptor, MetricDescriptorType, TimeSeriesPoint, Timestamp } from '@opencensus/core';
import { Distribution, LabelDescriptor, MetricDescriptor, MetricKind, MonitoredResource, Point, TimeSeries, ValueType } from './types';
export declare const OPENCENSUS_TASK_VALUE_DEFAULT: string;
/** Converts a OpenCensus MetricDescriptor to a StackDriver MetricDescriptor. */
export declare function createMetricDescriptorData(metricDescriptor: OCMetricDescriptor, metricPrefix: string, displayNamePrefix: string): MetricDescriptor;
/**
 * Converts metric's timeseries to a list of TimeSeries, so that metric can be
 * uploaded to StackDriver.
 */
export declare function createTimeSeriesList(metric: Metric, monitoredResource: MonitoredResource, metricPrefix: string): TimeSeries[];
/** Creates Metric type. */
declare function createMetricType(name: string, metricPrefix: string): string;
/** Creates Metric display name. */
declare function createDisplayName(name: string, displayNamePrefix: string): string;
/** Converts a OpenCensus Type to a StackDriver MetricKind. */
declare function createMetricKind(metricDescriptorType: MetricDescriptorType): MetricKind;
/** Converts a OpenCensus Type to a StackDriver ValueType. */
declare function createValueType(metricDescriptorType: MetricDescriptorType): ValueType;
/** Constructs a LabelDescriptor from a LabelKey. */
declare function createLabelDescriptor(labelKeys: LabelKey[]): LabelDescriptor[];
/** Creates a Metric using the LabelKeys and LabelValues. */
declare function createMetric(metricDescriptor: OCMetricDescriptor, labelValues: LabelValue[], metricPrefix: string): {
    type: string;
    labels: {
        [key: string]: string;
    };
};
/**
 * Converts timeseries's point, so that metric can be uploaded to StackDriver.
 */
declare function createPoint(point: TimeSeriesPoint, valueType: ValueType, startTimeStamp?: Timestamp): Point;
/** Converts a OpenCensus Point's value to a StackDriver Point value. */
declare function createValue(valueType: ValueType, point: TimeSeriesPoint): {
    int64Value: number;
    doubleValue?: undefined;
    distributionValue?: undefined;
} | {
    doubleValue: number;
    int64Value?: undefined;
    distributionValue?: undefined;
} | {
    distributionValue: Distribution;
    int64Value?: undefined;
    doubleValue?: undefined;
};
/** Formats an OpenCensus Distribution to Stackdriver's format. */
declare function createDistribution(distribution: DistributionValue): Distribution;
/** Converts a OpenCensus BucketOptions to a StackDriver BucketOptions. */
declare function createExplicitBucketOptions(bucketOptions: BucketOptions): number[];
/** Converts a OpenCensus Buckets to a list of counts. */
declare function createBucketCounts(buckets: DistributionBucket[]): number[];
export declare const TEST_ONLY: {
    createMetricType: typeof createMetricType;
    createDisplayName: typeof createDisplayName;
    createPoint: typeof createPoint;
    createMetric: typeof createMetric;
    createLabelDescriptor: typeof createLabelDescriptor;
    createValueType: typeof createValueType;
    createMetricKind: typeof createMetricKind;
    createDistribution: typeof createDistribution;
    createExplicitBucketOptions: typeof createExplicitBucketOptions;
    createValue: typeof createValue;
    createBucketCounts: typeof createBucketCounts;
};
export {};
