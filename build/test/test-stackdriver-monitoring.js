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
const core_1 = require("@opencensus/core");
const assert = require("assert");
const stackdriver_monitoring_1 = require("../src/stackdriver-monitoring");
const types_1 = require("../src/types");
const nocks = require("./nocks");
const PROJECT_ID = 'fake-project-id';
class MockLogger {
    constructor() {
        // tslint:disable-next-line:no-any
        this.debugBuffer = [];
    }
    cleanAll() {
        this.debugBuffer = [];
    }
    // tslint:disable-next-line:no-any
    debug(message, ...args) {
        this.debugBuffer.push(...args);
    }
    // tslint:disable-next-line:no-any
    error(...args) { }
    // tslint:disable-next-line:no-any
    warn(...args) { }
    // tslint:disable-next-line:no-any
    info(...args) { }
}
describe('Stackdriver Stats Exporter', () => {
    // CircleCI pre-empts the VM
    const DELAY = 200;
    describe('test constants', () => {
        assert.strictEqual(stackdriver_monitoring_1.StackdriverStatsExporter.CUSTOM_OPENCENSUS_DOMAIN, 'custom.googleapis.com/opencensus');
        assert.strictEqual(stackdriver_monitoring_1.StackdriverStatsExporter.DEFAULT_DISPLAY_NAME_PREFIX, 'OpenCensus');
    });
    describe('Send data to Stackdriver', () => {
        const mockLogger = new MockLogger();
        let exporterOptions;
        let exporter;
        before(() => {
            exporterOptions = {
                period: 0,
                projectId: PROJECT_ID,
                logger: mockLogger,
            };
            nocks.noDetectResource();
            exporter = new stackdriver_monitoring_1.StackdriverStatsExporter(exporterOptions);
            nocks.oauth2();
        });
        afterEach(() => {
            exporter.stop();
            mockLogger.cleanAll();
            core_1.globalStats.clear();
        });
        it('should not export for empty data', () => {
            core_1.globalStats.registerExporter(exporter);
            assert.strictEqual(mockLogger.debugBuffer.length, 0);
        });
        it('should export the data', () => __awaiter(void 0, void 0, void 0, function* () {
            const METRIC_NAME = 'metric-name';
            const METRIC_DESCRIPTION = 'metric-description';
            const UNIT = core_1.MeasureUnit.UNIT;
            const METRIC_OPTIONS = {
                description: METRIC_DESCRIPTION,
                unit: UNIT,
                labelKeys: [{ key: 'code', description: 'desc' }],
            };
            const metricRegistry = core_1.Metrics.getMetricRegistry();
            const gauge = metricRegistry.addInt64Gauge(METRIC_NAME, METRIC_OPTIONS);
            gauge.getDefaultTimeSeries().add(100);
            nocks.metricDescriptors(PROJECT_ID);
            nocks.timeSeries(PROJECT_ID);
            yield exporter.export();
            assert.strictEqual(mockLogger.debugBuffer.length, 1);
            const [metricDescriptor] = mockLogger.debugBuffer;
            assert.strictEqual(metricDescriptor.type, `${stackdriver_monitoring_1.StackdriverStatsExporter.CUSTOM_OPENCENSUS_DOMAIN}/${METRIC_NAME}`);
            assert.strictEqual(metricDescriptor.description, METRIC_DESCRIPTION);
            assert.strictEqual(metricDescriptor.displayName, `${stackdriver_monitoring_1.StackdriverStatsExporter.DEFAULT_DISPLAY_NAME_PREFIX}/${METRIC_NAME}`);
            assert.strictEqual(metricDescriptor.metricKind, types_1.MetricKind.GAUGE);
            assert.strictEqual(metricDescriptor.valueType, types_1.ValueType.INT64);
            assert.strictEqual(metricDescriptor.unit, UNIT);
            assert.deepStrictEqual(metricDescriptor.labels, [
                { key: 'code', valueType: 'STRING', description: 'desc' },
                {
                    key: 'opencensus_task',
                    valueType: 'STRING',
                    description: 'Opencensus task identifier',
                },
            ]);
            yield new Promise(resolve => setTimeout(resolve, DELAY)).then(() => {
                const timeSeries = mockLogger.debugBuffer[1][0];
                assert.strictEqual(timeSeries.metric.type, `${stackdriver_monitoring_1.StackdriverStatsExporter.CUSTOM_OPENCENSUS_DOMAIN}/${METRIC_NAME}`);
                assert.ok(timeSeries.resource.type);
                assert.ok(timeSeries.resource.labels.project_id);
                assert.strictEqual(timeSeries.resource.labels.project_id, PROJECT_ID);
                assert.strictEqual(timeSeries.metricKind, types_1.MetricKind.GAUGE);
                assert.strictEqual(timeSeries.valueType, types_1.ValueType.INT64);
                assert.ok(timeSeries.points.length > 0);
                assert.deepStrictEqual(timeSeries.points[0].value.int64Value, 100);
            });
        }));
    });
});
//# sourceMappingURL=test-stackdriver-monitoring.js.map