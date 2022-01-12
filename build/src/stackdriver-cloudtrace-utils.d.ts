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
import * as coreTypes from '@opencensus/core';
import * as types from './types';
/**
 * Creates StackDriver Links from OpenCensus Link.
 * @param links coreTypes.Link[]
 * @param droppedLinksCount number
 * @returns types.Links
 */
export declare function createLinks(links: coreTypes.Link[], droppedLinksCount: number): types.Links;
/**
 * Creates StackDriver Attributes from OpenCensus Attributes.
 * @param attributes coreTypes.Attributes
 * @param resourceLabels Record<string, types.AttributeValue>
 * @param droppedAttributesCount number
 * @returns types.Attributes
 */
export declare function createAttributes(attributes: coreTypes.Attributes, resourceLabels: Record<string, types.AttributeValue>, droppedAttributesCount: number): types.Attributes;
/**
 * Creates StackDriver TimeEvents from OpenCensus Annotation and MessageEvent.
 * @param annotationTimedEvents coreTypes.Annotation[]
 * @param messageEventTimedEvents coreTypes.MessageEvent[]
 * @param droppedAnnotationsCount number
 * @param droppedMessageEventsCount number
 * @returns types.TimeEvents
 */
export declare function createTimeEvents(annotationTimedEvents: coreTypes.Annotation[], messageEventTimedEvents: coreTypes.MessageEvent[], droppedAnnotationsCount: number, droppedMessageEventsCount: number): types.TimeEvents;
export declare function stringToTruncatableString(value: string): types.TruncatableString;
export declare function getResourceLabels(monitoredResource: Promise<types.MonitoredResource>): Promise<Record<string, types.AttributeValue>>;
