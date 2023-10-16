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
const KOMODOR_ERROR =
  'An error occurred while fetching the data from Komodor service.';

export interface KomodorWorkerInfo {
  apiKey: string;
  url: string;
  cacheOptions?: CacheOptions;
}

const defaultCacheOptions: CacheOptions = {
  shouldFetch: true,
  shouldUpdate: true,
};

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

  async getServiceInfo(
    request,
    response,
    cacheOptions: CacheOptions = this.cacheOptions,
  ) {
    let data;
    let status = 200;

    try {
      const queryParams = new URLSearchParams(request.query);
      const params: KomodorApiRequestInfo = {
        workloadName: queryParams.get('workload_name') ?? 'default',
        workloadNamespace: queryParams.get('workload_namespace') ?? 'default',
        workloadUUID: queryParams.get('workload_uuid') ?? 'default',
      };

      const { shouldFetch } = cacheOptions;
      const existingData = shouldFetch
        ? this.cache.getDataItem(params)?.responseInfo
        : undefined;

      data =
        shouldFetch && existingData
          ? existingData
          : await this.api.fetch(params);

      // Stores the fresh data as long as the data the cache is in use.
      if (shouldFetch) {
        this.cache.setDataItem(params, data);
      }
    } catch (error) {
      data = KOMODOR_ERROR;

      // Internal server error
      status = 500;
    }

    return await response.status(status).json(data);
  }

  async start() {
    if (this.cacheOptions.shouldUpdate) {
      await this.startUpdatingCache();
    }
  }

  private async startUpdatingCache() {
    const tempCache = new ServiceCache(this.cache);

    while (!this.signal) {
      try {
        tempCache.forEach(async (requestInfo, _responseItem) => {
          let result: boolean = true;

          try {
            const lastUpdateRequest =
              this.cache.getDataItem(requestInfo)?.lastUpdateRequest;
            const irrelevant =
              lastUpdateRequest !== undefined &&
              Date.now() - lastUpdateRequest >=
                CONSIDER_IRRELEVANT_DATA_INTERVAL;

            if (irrelevant) {
              this.cache.removeDataItem(requestInfo);
            }

            const responseInfo = await this.api.fetch(requestInfo);
            this.cache.setDataItem(requestInfo, responseInfo);
          } catch (error) {
            this.stopUpdatingCache();
            result = false;

            throw error;
          }

          return result;
        });
      } catch (error) {
        this.stopUpdatingCache();
      }

      await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL));
    }
  }

  stopUpdatingCache() {
    // This does not happen immediately as if there's any fetch request pending,
    // all the data in the cache should be fetched before
    this.signal = true;
  }
}
