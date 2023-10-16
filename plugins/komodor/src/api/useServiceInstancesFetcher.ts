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
import { ServiceInstanceInfo } from '../types/types';
import { runPeriodically } from '../tools';
import { KomodorApi } from './komodorApi';
import { useMemo } from 'react';

const PLUGIN_WORKLOAD_UUID_ANNOTATION = 'komodor.com/workloadUUID';
const PLUGIN_WORKLOAD_NAME_ANNOTATION = 'komodor.com/workloadName';
const PLUGIN_WORKLOAD_NAMESPACE_ANNOTATION = 'komodor.com/workloadNamespace';

class ServiceInstancesFetcher {
  private entity: Entity;
  private api: KomodorApi;
  private interval: number;
  private isWorking: boolean;
  private cancellationMethod: (() => void) | undefined;

  /**
   * Fetches the service instances from the backend periodically.
   * @param entity The info about the service.
   * @param api Komodor API object
   */
  constructor(entity: Entity, api: KomodorApi) {
    this.entity = entity;
    this.api = api;
    this.interval = Number.parseInt(
      entity.metadata?.annotations?.intervalMs ?? '5000',
      10,
    );
    this.isWorking = false;
  }

  public getServiceInstancesPeriodically(
    updateCallback: (data: ServiceInstanceInfo[]) => void,
    errorCallback: (errorMessage: string) => void,
  ) {
    const run = async () => {
      try {
        this.isWorking = true;
        const response = await this.api.getServiceInstances({
          workloadName:
            this.entity.metadata?.annotations?.[
              `${PLUGIN_WORKLOAD_NAME_ANNOTATION}`
            ] ?? 'default',
          workloadNamespace:
            this.entity.metadata?.annotations?.[
              `${PLUGIN_WORKLOAD_NAMESPACE_ANNOTATION}`
            ] ?? 'default',
          workloadUUID:
            this.entity.metadata?.annotations?.[
              `${PLUGIN_WORKLOAD_UUID_ANNOTATION}`
            ] ?? 'default',
        });
        updateCallback(response);
      } catch (error) {
        errorCallback(`Details: ${JSON.stringify(error)}`);
      }
    };

    this.cancellationMethod = runPeriodically(run, this.interval);
  }

  public stopPeriodicFetching() {
    if (this.cancellationMethod) {
      this.cancellationMethod();
      this.isWorking = false;
    }
  }

  public getIsWorking(): boolean {
    return this.isWorking;
  }
}

export function useServiceInstancesFetcher(
  entity: Entity,
  api: KomodorApi,
): { fetcher: ServiceInstancesFetcher } {
  const fetcher: ServiceInstancesFetcher = useMemo(
    () => new ServiceInstancesFetcher(entity, api),
    [entity, api],
  );

  return { fetcher };
}
