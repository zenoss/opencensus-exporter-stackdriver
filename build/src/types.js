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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValueType = exports.MetricKind = exports.LinkType = exports.Type = void 0;
var Type;
(function (Type) {
    Type[Type["TYPE_UNSPECIFIED"] = 0] = "TYPE_UNSPECIFIED";
    Type[Type["SENT"] = 1] = "SENT";
    Type[Type["RECEIVED"] = 2] = "RECEIVED";
})(Type = exports.Type || (exports.Type = {}));
var LinkType;
(function (LinkType) {
    LinkType[LinkType["UNSPECIFIED"] = 0] = "UNSPECIFIED";
    LinkType[LinkType["CHILD_LINKED_SPAN"] = 1] = "CHILD_LINKED_SPAN";
    LinkType[LinkType["PARENT_LINKED_SPAN"] = 2] = "PARENT_LINKED_SPAN";
})(LinkType = exports.LinkType || (exports.LinkType = {}));
var MetricKind;
(function (MetricKind) {
    MetricKind["UNSPECIFIED"] = "METRIC_KIND_UNSPECIFIED";
    MetricKind["GAUGE"] = "GAUGE";
    MetricKind["DELTA"] = "DELTA";
    MetricKind["CUMULATIVE"] = "CUMULATIVE";
})(MetricKind = exports.MetricKind || (exports.MetricKind = {}));
var ValueType;
(function (ValueType) {
    ValueType["VALUE_TYPE_UNSPECIFIED"] = "VALUE_TYPE_UNSPECIFIED";
    ValueType["INT64"] = "INT64";
    ValueType["DOUBLE"] = "DOUBLE";
    ValueType["DISTRIBUTION"] = "DISTRIBUTION";
})(ValueType = exports.ValueType || (exports.ValueType = {}));
//# sourceMappingURL=types.js.map