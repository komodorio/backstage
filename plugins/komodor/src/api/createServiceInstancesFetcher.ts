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

import { Entity } from '@backstage/catalog-model';
import { ServiceInstancesResponseInfo } from '../types/types';
import { runPeriodically } from '../tools';
import { KomodorApi } from './komodorApi';

/**
 * Fetches the service instances from the backend periodically.
 * @param entity The info about the service.
 * @param api Komodor API object
 */
export function createServiceInstancesFetcher(entity: Entity, api: KomodorApi) {
  const servicesApi = api;
  const interval: number = Number.parseInt(
    entity.metadata?.annotations?.intervalMs ?? '5000',
    10,
  );
  let cancellationMethod: () => void;

  /**
   * Fetches data from the agent periodically
   * @param updateCallback A functions that's called when new data is fetched
   * @param errorCallback An error that's called when new data is fetched
   */
  function getServiceInstancesPeriodically(
    updateCallback: (data: ServiceInstancesResponseInfo) => void,
    errorCallback: (errorMessage: string) => void,
  ) {
    async function run() {
      try {
        const response = await servicesApi.getServiceInstances({
          workloadName: entity.metadata?.annotations?.workloadName ?? 'default',
          workloadNamespace:
            entity.metadata?.annotations?.workloadNamespace ?? 'default',
          workloadUUID: entity.metadata?.annotations?.workloadUUID ?? 'default',
        });

        updateCallback(response);
      } catch (error) {
        errorCallback(error);
      }
    }

    cancellationMethod = runPeriodically(run, interval);
  }

  /**
   *  Stops the data fetching
   */
  function stopPeriodicFetching() {
    cancellationMethod();
  }

  return { getServiceInstancesPeriodically, stopPeriodicFetching };
}
