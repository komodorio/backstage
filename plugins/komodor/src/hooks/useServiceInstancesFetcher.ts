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
import { komodorApiRef } from '../api';
import { useCallback } from 'react';
import useAsyncRetry from 'react-use/lib/useAsyncRetry';
import useInterval from 'react-use/lib/useInterval';
import { useApi } from '@backstage/core-plugin-api';

const PLUGIN_WORKLOAD_UUID_ANNOTATION = 'komodor.com/workloadUUID';
const PLUGIN_WORKLOAD_NAME_ANNOTATION = 'komodor.com/workloadName';
const PLUGIN_WORKLOAD_NAMESPACE_ANNOTATION = 'komodor.com/workloadNamespace';
const API_QUERY_PARAM_DEFAULT_VALUE = 'default';
const POLLING_INTERVAL_MS = 5000;

export interface KomodorObjects {
  objects: ServiceInstanceInfo[] | undefined;
  error?: string;
}

export const useServiceInstancesFetcher = (entity: Entity): KomodorObjects => {
  const api = useApi(komodorApiRef);
  const getObjects = useCallback(async (): Promise<ServiceInstanceInfo[]> => {
    return await api.getServiceInstances({
      workloadName:
        entity.metadata?.annotations?.[`${PLUGIN_WORKLOAD_NAME_ANNOTATION}`] ??
        API_QUERY_PARAM_DEFAULT_VALUE,
      workloadNamespace:
        entity.metadata?.annotations?.[
          `${PLUGIN_WORKLOAD_NAMESPACE_ANNOTATION}`
        ] ?? API_QUERY_PARAM_DEFAULT_VALUE,
      workloadUUID:
        entity.metadata?.annotations?.[`${PLUGIN_WORKLOAD_UUID_ANNOTATION}`] ??
        API_QUERY_PARAM_DEFAULT_VALUE,
    });
  }, [api, entity]);

  const { value, error, retry } = useAsyncRetry(
    () => getObjects(),
    [getObjects],
  );

  useInterval(() => retry(), POLLING_INTERVAL_MS);

  return {
    objects: value,
    error: error?.message,
  };
};
