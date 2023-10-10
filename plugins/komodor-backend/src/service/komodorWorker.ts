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

import { KomodorApiRequestInfo } from '../types/types';
import { KomodorApi } from './komodorApi';
import { CacheOptions, ServiceCache } from './serviceCache';

const POLLING_INTERVAL = 5000;
const CONSIDER_IRRELEVANT_DATA_INTERVAL = 30000;

export interface KomodorWorkerInfo {
  apiKey: string;
  url: string;
  cacheOptions?: CacheOptions;
}

const defaultCacheOptions: CacheOptions = {
  shouldFetch: false,
  shouldUpdate: false,
};

/*
 * Polls the agent and updates connected clients.
 */
export class KomodorWorker {
  private readonly cache: ServiceCache;
  private readonly api: KomodorApi;
  private readonly cacheOptions: CacheOptions;
  private signal: boolean;

  constructor(workerInfo: KomodorWorkerInfo) {
    const { apiKey, url, cacheOptions } = workerInfo;

    this.api = new KomodorApi({ apiKey, url });
    this.cache = new ServiceCache();
    this.cacheOptions = cacheOptions ?? defaultCacheOptions;
    this.signal = false;
  }

  /**
   * Fetches services data
   * @param request
   * @param response
   * @param cacheOptions Cache options for the requests
   * @returns
   */
  async getServiceInfo(
    request,
    response,
    cacheOptions: CacheOptions = this.cacheOptions,
  ) {
    const params = request.params as KomodorApiRequestInfo;
    const existingData = this.cache.getDataItem(params)?.responseInfo;
    const { shouldFetch, shouldUpdate } = cacheOptions;

    const data =
      shouldFetch && existingData ? existingData : await this.api.fetch(params);

    if (shouldUpdate && !!existingData) {
      this.cache.setDataItem(params, data);
    }

    return await response.json(data);
  }

  /**
   * Starts the worker
   */
  async start() {
    await this.startUpdatingCache();
  }

  /**
   * Starts updating the cache periodically
   */
  private async startUpdatingCache() {
    const tempCache: ServiceCache = new ServiceCache(this.cache);

    while (!this.signal) {
      try {
        tempCache.forEach(async (requestInfo, _responseItem) => {
          // Checks it the cache can get rid if specific data which hasn't been
          // required by the client for a long time.
          const lastUpdateRequest =
            this.cache.getDataItem(requestInfo)?.lastUpdateRequest;

          const irrelevant: boolean =
            lastUpdateRequest !== undefined &&
            Date.now() - lastUpdateRequest >= CONSIDER_IRRELEVANT_DATA_INTERVAL;

          if (irrelevant) {
            this.cache.removeDataItem(requestInfo);
          }

          const responseInfo = await this.api.fetch(requestInfo);
          this.cache.setDataItem(requestInfo, responseInfo);
        });
      } catch (error) {
        this.stopUpdatingCache();
      }

      await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL));
    }
  }

  /**
   * Stops updating the cache
   */
  stopUpdatingCache() {
    this.signal = true;
  }
}
