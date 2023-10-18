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

import { ResponseError } from '@backstage/errors';
import { KomodorApiRequestInfo } from '../types/types';
import { KomodorApi } from './komodorApi';
import { CacheOptions, ServiceCache } from './serviceCache';

const POLLING_INTERVAL = 5000;
const CONSIDER_IRRELEVANT_DATA_INTERVAL = 30000;
const KOMODOR_ERROR =
  'An error occurred while fetching the data from Komodor service.';
const API_QUERY_PARAMS_WORKLOAD_NAME = 'workload_name';
const API_QUERY_PARAMS_WORKLOAD_NAMESPACE = 'workload_namespace';
const API_QUERY_PARAMS_WORKLOAD_UUID = 'workload_uuid';
const API_QUERY_PARAMS_DEFAULT_VALUE = 'default';

export interface KomodorWorkerInfo {
  /**
   * API key of the agent
   */
  apiKey: string;
  /**
   * Base URL of the API
   */
  url: string;
  /**
   * Cache settings
   */
  cacheOptions?: CacheOptions;
}

const defaultCacheOptions: CacheOptions = {
  shouldFetch: true,
  shouldUpdate: true,
};

/**
 * Fetching data from komodor, managing the cache
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
   * @param cacheOptions
   * @returns
   */
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
        workloadName:
          queryParams.get(API_QUERY_PARAMS_WORKLOAD_NAME) ??
          API_QUERY_PARAMS_DEFAULT_VALUE,
        workloadNamespace:
          queryParams.get(API_QUERY_PARAMS_WORKLOAD_NAMESPACE) ??
          API_QUERY_PARAMS_DEFAULT_VALUE,
        workloadUUID:
          queryParams.get(API_QUERY_PARAMS_WORKLOAD_UUID) ??
          API_QUERY_PARAMS_DEFAULT_VALUE,
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
      if (error instanceof ResponseError) {
        data = error.cause ?? KOMODOR_ERROR;
        status = error.body.response.statusCode;
      } else {
        // Generic error
        data = KOMODOR_ERROR;
        status = 500;
      }
    }

    return await response.status(status).json(data);
  }

  /**
   * Starts updating the cache periodically
   */
  async start() {
    if (this.cacheOptions.shouldUpdate && this.signal) {
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

            // Removes items that haven't been requested for a long time.
            const irrelevant =
              lastUpdateRequest !== undefined &&
              Date.now() - lastUpdateRequest >=
                CONSIDER_IRRELEVANT_DATA_INTERVAL;

            if (irrelevant) {
              this.cache.removeDataItem(requestInfo);
            }

            const responseInfo = await this.api.fetch(requestInfo);
            this.cache.setDataItem(requestInfo, responseInfo, false);
          } catch (error) {
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
    // all the data in the cache should be fetched before.
    this.signal = true;
  }
}
