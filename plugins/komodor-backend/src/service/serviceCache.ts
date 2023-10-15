/*
 * Copyright 2023 The Backstage Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { KomodorApiRequestInfo, KomodorApiResponseInfo } from '../types/types';

/**
 * An item in the cache
 */
export interface ServiceCacheItem {
  data: {
    items: Array<{
      requestInfo: KomodorApiRequestInfo;
      responseInfo: Array<KomodorApiResponseInfo>;
      lastUpdateRequest: number;
    }>;
  };
}

/**
 * Options for accessing the cache
 */
export interface CacheOptions {
  /**
   * Should data be fetched from the cache if exists
   */
  shouldFetch: boolean;

  /**
   * Should the cache be updated constantly.
   */
  shouldUpdate: boolean;
}

/** *
 * A cache for services data
 */
export class ServiceCache {
  private cache: Map<string, ServiceCacheItem>;

  /**
   * Creates a new cache
   * @param cache Data source from old caches. If not set, create an empty cache.
   */
  constructor(cache?: ServiceCache) {
    this.cache = cache?.cache ?? new Map<string, ServiceCacheItem>();
  }

  /**
   * Gets the exact item's data from the cache, according to the parameters.
   * @param params Request's parameters.
   * @returns Returns the desired data.
   */
  getDataItem(params: KomodorApiRequestInfo) {
    const uuid = params.workloadUUID;
    if (this.cache.has(uuid)) {
      const items = this.cache.get(uuid)?.data.items || [];
      return items.find(
        item =>
          item.requestInfo.workloadName === params.workloadName &&
          item.requestInfo.workloadNamespace === params.workloadNamespace,
      );
    }
    return undefined;
  }

  /**
   * Sets the exact item's data from the cache, according to the parameters, to the given data.
   * @param params Request's parameters.
   * @param data The value
   * @returns True if succeeded.
   */
  setDataItem(
    params: KomodorApiRequestInfo,
    data: Array<KomodorApiResponseInfo>,
  ) {
    const uuid = params.workloadUUID;
    if (this.cache.has(uuid)) {
      const item = this.getDataItem(params);
      if (item) {
        item.responseInfo = data;
        item.lastUpdateRequest = Date.now();
      } else {
        this.cache.get(uuid)?.data.items.push({
          requestInfo: params,
          responseInfo: data,
          lastUpdateRequest: Date.now(),
        });
      }
    } else {
      const cacheItem = {
        data: {
          items: [
            {
              requestInfo: params,
              responseInfo: data,
              lastUpdateRequest: Date.now(),
            },
          ],
        },
      };
      this.cache.set(uuid, cacheItem);
    }
  }

  /**
   * Removes a data item
   * @param params Request's parameters
   * @returns True if the operation succeeded, false if not (possibly not found).
   */
  removeDataItem(params: KomodorApiRequestInfo): boolean {
    const uuid = params.workloadUUID;
    if (this.cache.has(uuid)) {
      const items = this.cache.get(uuid)?.data.items || [];
      for (let index = 0; index < items.length; index++) {
        const currentItem = items[index];
        if (
          currentItem.requestInfo.workloadName === params.workloadName &&
          currentItem.requestInfo.workloadNamespace === params.workloadNamespace
        ) {
          items.splice(index, 1);
          if (items.length === 0) {
            this.cache.delete(uuid);
          }
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Goes through all the items in all the key-value pairs in the map.
   * @param callback Function to call with an item loaded.
   */
  forEach(
    callback: (
      requestInfo: KomodorApiRequestInfo,
      responseInfo: Array<KomodorApiResponseInfo>,
    ) => void,
  ) {
    this.cache.forEach((_value, key) => {
      const items = this.cache.get(key)?.data.items || [];
      items.forEach(item => {
        callback(item.requestInfo, item.responseInfo);
      });
    });
  }
}
