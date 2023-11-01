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
import { KomodorApiRequestInfo, KomodorApiResponseInfo } from '../types/types';
import { KomodorApi } from './komodorApi';
import { CacheOptions, Workload, WorkloadCache } from './workloadCache';

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
  private readonly cache: WorkloadCache;
  private readonly api: KomodorApi;
  private readonly cacheOptions: CacheOptions;
  private signal: boolean;

  constructor(workerInfo: KomodorWorkerInfo) {
    const { apiKey, url, cacheOptions } = workerInfo;

    this.api = new KomodorApi({ apiKey, url });
    this.cache = new WorkloadCache();
    this.cacheOptions = cacheOptions ?? defaultCacheOptions;
    this.signal = true;
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
    let data: KomodorApiResponseInfo[] | string | Error;
    let status = 200;

    try {
      const queryParams = new URLSearchParams(request.query);
      const params: KomodorApiRequestInfo = {
        workload_name:
          queryParams.get(API_QUERY_PARAMS_WORKLOAD_NAME) ??
          API_QUERY_PARAMS_DEFAULT_VALUE,
        workload_namespace:
          queryParams.get(API_QUERY_PARAMS_WORKLOAD_NAMESPACE) ??
          API_QUERY_PARAMS_DEFAULT_VALUE,
        workload_uuid: queryParams.get(API_QUERY_PARAMS_WORKLOAD_UUID) ?? '',
      };

      const { shouldFetch } = cacheOptions;

      // Fetched the data from the cache, whether it's a single workload or multiple.
      let existingData: Workload[] | undefined;

      if (shouldFetch) {
        if (params.workload_uuid && queryParams.has(params.workload_uuid)) {
          const workload = this.cache.getWorkloadByUUID(params?.workload_uuid);

          if (workload) {
            existingData = [workload];
          }
        } else {
          existingData = this.cache.getWorkloads(
            workload =>
              workload.name === params.workload_name &&
              workload.namespace === params.workload_namespace,
          );
        }
      }
      // Fetches the data right from Komodor or at least from the cache, after formatting it
      data =
        shouldFetch && existingData && existingData.length > 0
          ? existingData.map(function (workload) {
              return {
                workload_uuid: workload.uuid,
                cluster_name: workload.clusterName,
                status: workload.status,
              };
            })
          : await this.api.fetch(params);

      // Why not updating the cache with some fresh data ;)?
      if (shouldFetch) {
        data.forEach(workload => {
          const item = this.cache.getWorkloadByUUID(workload.workload_uuid);

          if (item) {
            item.clusterName = workload.cluster_name;
            item.status = workload.status;

            this.cache.setWorkload(item);
          } else {
            this.cache.setWorkload({
              uuid: workload.workload_uuid,
              name: params.workload_name,
              namespace: params.workload_namespace,
              clusterName: workload.cluster_name,
              status: workload.status,
              lastUpdateRequest: Date.now(),
            });
          }
        });
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
    this.signal = false;

    while (!this.signal) {
      try {
        const tempCache = new WorkloadCache(this.cache);
        tempCache.forEach(async workload => {
          let result: boolean = true;

          try {
            // Removes items that haven't been requested for a long time.
            const irrelevant =
              Date.now() - workload.lastUpdateRequest >=
              CONSIDER_IRRELEVANT_DATA_INTERVAL;

            if (irrelevant) {
              this.cache.removeWorkload(workload.uuid);
            }

            const data: KomodorApiResponseInfo[] = await this.api.fetch({
              workload_uuid: workload.uuid,
              workload_name: workload.name,
              workload_namespace: workload.namespace,
            });

            const updatedWorkload: Workload | undefined = data
              .map(function (response) {
                return {
                  uuid: workload.uuid,
                  name: workload.name,
                  namespace: workload.namespace,
                  clusterName: response.cluster_name,
                  status: response.status,
                  lastUpdateRequest: Date.now(),
                };
              })
              .at(0);

            if (updatedWorkload) {
              this.cache.setWorkload(updatedWorkload, false);
            }
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
