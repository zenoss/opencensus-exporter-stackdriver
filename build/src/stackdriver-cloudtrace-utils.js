"use strict";
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
exports.getResourceLabels = exports.stringToTruncatableString = exports.createTimeEvents = exports.createAttributes = exports.createLinks = void 0;
const coreTypes = require("@opencensus/core");
const types = require("./types");
const AGENT_LABEL_KEY = 'g.co/agent';
const AGENT_LABEL_VALUE_STRING = `opencensus-node [${coreTypes.version}]`;
const AGENT_LABEL_VALUE = createAttributeValue(AGENT_LABEL_VALUE_STRING);
const HTTP_ATTRIBUTE_MAPPING = {
    'http.host': '/http/host',
    'http.method': '/http/method',
    'http.path': '/http/path',
    'http.route': '/http/route',
    'http.user_agent': '/http/user_agent',
    'http.status_code': '/http/status_code',
    'http.url': '/http/url',
};
/**
 * Creates StackDriver Links from OpenCensus Link.
 * @param links coreTypes.Link[]
 * @param droppedLinksCount number
 * @returns types.Links
 */
function createLinks(links, droppedLinksCount) {
    return { link: links.map(link => createLink(link)), droppedLinksCount };
}
exports.createLinks = createLinks;
/**
 * Creates StackDriver Attributes from OpenCensus Attributes.
 * @param attributes coreTypes.Attributes
 * @param resourceLabels Record<string, types.AttributeValue>
 * @param droppedAttributesCount number
 * @returns types.Attributes
 */
function createAttributes(attributes, resourceLabels, droppedAttributesCount) {
    const attributesBuilder = createAttributesBuilder(attributes, droppedAttributesCount);
    if (attributesBuilder.attributeMap) {
        attributesBuilder.attributeMap[AGENT_LABEL_KEY] = AGENT_LABEL_VALUE;
    }
    attributesBuilder.attributeMap = Object.assign({}, attributesBuilder.attributeMap, resourceLabels);
    return attributesBuilder;
}
exports.createAttributes = createAttributes;
/**
 * Creates StackDriver TimeEvents from OpenCensus Annotation and MessageEvent.
 * @param annotationTimedEvents coreTypes.Annotation[]
 * @param messageEventTimedEvents coreTypes.MessageEvent[]
 * @param droppedAnnotationsCount number
 * @param droppedMessageEventsCount number
 * @returns types.TimeEvents
 */
function createTimeEvents(annotationTimedEvents, messageEventTimedEvents, droppedAnnotationsCount, droppedMessageEventsCount) {
    let timeEvents = [];
    if (annotationTimedEvents) {
        timeEvents = annotationTimedEvents.map(annotation => ({
            time: new Date(annotation.timestamp).toISOString(),
            annotation: {
                description: stringToTruncatableString(annotation.description),
                attributes: createAttributesBuilder(annotation.attributes, 0),
            },
        }));
    }
    if (messageEventTimedEvents) {
        timeEvents.push(...messageEventTimedEvents.map(messageEvent => ({
            time: new Date(messageEvent.timestamp).toISOString(),
            messageEvent: {
                id: String(messageEvent.id),
                type: createMessageEventType(messageEvent.type),
                uncompressedSizeBytes: String(messageEvent.uncompressedSize || 0),
                compressedSizeBytes: String(messageEvent.compressedSize || 0),
            },
        })));
    }
    return {
        timeEvent: timeEvents,
        droppedAnnotationsCount,
        droppedMessageEventsCount,
    };
}
exports.createTimeEvents = createTimeEvents;
function stringToTruncatableString(value) {
    return { value };
}
exports.stringToTruncatableString = stringToTruncatableString;
function getResourceLabels(monitoredResource) {
    return __awaiter(this, void 0, void 0, function* () {
        const resource = yield monitoredResource;
        const resourceLabels = {};
        if (resource.type === 'global') {
            return resourceLabels;
        }
        for (const key of Object.keys(resource.labels)) {
            const resourceLabel = `g.co/r/${resource.type}/${key}`;
            resourceLabels[resourceLabel] = createAttributeValue(resource.labels[key]);
        }
        return resourceLabels;
    });
}
exports.getResourceLabels = getResourceLabels;
function createAttributesBuilder(attributes, droppedAttributesCount) {
    const attributeMap = {};
    for (const key of Object.keys(attributes)) {
        const mapKey = HTTP_ATTRIBUTE_MAPPING[key] || key;
        attributeMap[mapKey] = createAttributeValue(attributes[key]);
    }
    return { attributeMap, droppedAttributesCount };
}
function createLink(link) {
    const traceId = link.traceId;
    const spanId = link.spanId;
    const type = createLinkType(link.type);
    const attributes = createAttributesBuilder(link.attributes, 0);
    return { traceId, spanId, type, attributes };
}
function createAttributeValue(value) {
    switch (typeof value) {
        case 'number':
            // TODO: Consider to change to doubleValue when available in V2 API.
            return { intValue: String(value) };
        case 'boolean':
            return { boolValue: value };
        case 'string':
            return { stringValue: stringToTruncatableString(value) };
        default:
            throw new Error(`Unsupported type : ${typeof value}`);
    }
}
function createMessageEventType(type) {
    switch (type) {
        case coreTypes.MessageEventType.SENT: {
            return types.Type.SENT;
        }
        case coreTypes.MessageEventType.RECEIVED: {
            return types.Type.RECEIVED;
        }
        default: {
            return types.Type.TYPE_UNSPECIFIED;
        }
    }
}
function createLinkType(type) {
    switch (type) {
        case coreTypes.LinkType.CHILD_LINKED_SPAN: {
            return types.LinkType.CHILD_LINKED_SPAN;
        }
        case coreTypes.LinkType.PARENT_LINKED_SPAN: {
            return types.LinkType.PARENT_LINKED_SPAN;
        }
        default: {
            return types.LinkType.UNSPECIFIED;
        }
    }
}
//# sourceMappingURL=stackdriver-cloudtrace-utils.js.map