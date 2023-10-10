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
      /**
       * Client's request
       */
      requestInfo: KomodorApiRequestInfo;
      /**
       * All the instances of the service, according to the request.
       */
      responseInfo: Array<KomodorApiResponseInfo>;
      /**
       * Last time the info was requested and updated.
       */
      lastUpdateRequest: number;
    }>;
  };
}

/**
 * Options for accessing the cache
 */
export interface CacheOptions {
  /**
   * Determined whether data should be fetched from the cache
   */
  shouldFetch: boolean;
  /**
   * Determines whether externally fetched data should be stored in the cache
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
    let item;

    if (this.cache.has(params.workloadUUID)) {
      const length: number =
        this.cache.get(params.workloadUUID)?.data?.items?.length ?? 0;

      for (let index = 0; index < length; index++) {
        const currentItem = this.cache.get(params.workloadUUID)?.data.items[
          index
        ];

        if (
          currentItem?.requestInfo.workloadName === params.workloadName &&
          currentItem?.requestInfo.workloadNamespace ===
            params.workloadNamespace
        ) {
          item = currentItem;
        }
      }
    }

    return item;
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
    const dataItem = this.getDataItem(params);

    if (dataItem) {
      dataItem.responseInfo = data;
      dataItem.lastUpdateRequest = Date.now();
    } else {
      if (this.cache.has(params.workloadUUID)) {
        this.cache.get(params.workloadUUID)?.data.items.push({
          requestInfo: params,
          responseInfo: data,
          lastUpdateRequest: Date.now(),
        });
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

        this.cache.set(params.workloadUUID, cacheItem);
      }
    }
  }

  /**
   * Removes a data item
   * @param params Request's parameters
   * @returns True if operation succeeded, false of not (possibly not found).
   */
  removeDataItem(params: KomodorApiRequestInfo): boolean {
    let result = false;

    if (this.cache.has(params.workloadUUID)) {
      const length: number =
        this.cache.get(params.workloadUUID)?.data?.items?.length ?? 0;

      for (let index = 0; index < length && !result; index++) {
        const currentItem = this.cache.get(params.workloadUUID)?.data.items[
          index
        ];

        if (
          currentItem?.requestInfo.workloadName === params.workloadName &&
          currentItem?.requestInfo.workloadNamespace ===
            params.workloadNamespace
        ) {
          const cacheItem = this.cache.get(params.workloadUUID);
          cacheItem?.data.items.splice(index, 1);

          if (cacheItem?.data.items.length === 0) {
            this.cache.delete(params.workloadUUID);
          }

          result = true;
        }
      }
    }

    return result;
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
      this.cache.get(key)?.data.items.forEach(item => {
        callback(item.requestInfo, item.responseInfo);
      });
    });
  }
}
