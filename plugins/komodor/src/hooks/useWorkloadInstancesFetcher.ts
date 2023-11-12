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
import { WorkloadInstanceInfo } from '../types/types';
import { komodorApiRef } from '../api';
import { useCallback } from 'react';
import useAsyncRetry from 'react-use/lib/useAsyncRetry';
import useInterval from 'react-use/lib/useInterval';
import { useApi } from '@backstage/core-plugin-api';
import { kubernetesApiRef } from '@backstage/plugin-kubernetes';
import useAsync from 'react-use/lib/useAsync';

const PLUGIN_WORKLOAD_NAME_ANNOTATION = 'komodor.io/workload-name';
const PLUGIN_WORKLOAD_NAMESPACE_ANNOTATION = 'komodor.io/workload-namespace';
const PLUGIN_WORKLOAD_CLUSTERS_ANNOTATION = 'komodor.io/clusters';
const PLUGIN_WORKLOAD_CUSTOM_UIDS = 'komodor.io/custom-uids';
const API_QUERY_PARAM_DEFAULT_VALUE = '!default!';
const KUBERNETES_WORKLOAD_PATH = '/api/v1/pods';
const POLLING_INTERVAL_MS = 5000;

export interface KomodorObjects {
  objects: WorkloadInstanceInfo[] | undefined;
  error?: string;
}

const defaultFilter = {
  name: API_QUERY_PARAM_DEFAULT_VALUE,
  namespace: API_QUERY_PARAM_DEFAULT_VALUE,
  uuids: [],
};

/**
 * Creates the workload filter out of the entity configuration, fetches data from kubernetes plugin
 */
export const useWorkloadFilter = (
  entity: Entity,
): { name: string; namespace: string; uuids: Array<string> } => {
  const kubernetesApi = useApi(kubernetesApiRef);
  const { value } = useAsync(async () => {
    const uuids: Array<string> = [];
    const clusterString: string | undefined =
      entity.metadata?.annotations?.[`${PLUGIN_WORKLOAD_CLUSTERS_ANNOTATION}`];
    if (clusterString) {
      const clusters: Array<string> = clusterString?.trim().split(',');

      for (const cluster of clusters) {
        try {
          const response = await kubernetesApi.proxy({
            clusterName: cluster,
            path: KUBERNETES_WORKLOAD_PATH,
          });
          const items = (await response.json()).items;
          items.forEach(item => {
            uuids.push(item.metadata.uid);
          });
        } catch (error) {
          break;
        }
      }
    }

    const customUIDsString: string | undefined =
      entity.metadata?.annotations?.[`${PLUGIN_WORKLOAD_CUSTOM_UIDS}`];

    if (customUIDsString) {
      const customUIDs: Array<string> = customUIDsString?.trim().split(',');

      uuids.push(...customUIDs);
    }
    return {
      name:
        entity.metadata?.annotations?.[`${PLUGIN_WORKLOAD_NAME_ANNOTATION}`] ??
        API_QUERY_PARAM_DEFAULT_VALUE,
      namespace:
        entity.metadata?.annotations?.[
          `${PLUGIN_WORKLOAD_NAMESPACE_ANNOTATION}`
        ] ?? API_QUERY_PARAM_DEFAULT_VALUE,
      uuids: uuids,
    };
  }, []);

  return value ?? defaultFilter;
};

export const useWorkloadInstancesFetcher = (
  filter: { name: string; namespace: string; uuids: Array<string> } | null = {
    name: API_QUERY_PARAM_DEFAULT_VALUE,
    namespace: API_QUERY_PARAM_DEFAULT_VALUE,
    uuids: [],
  },
): KomodorObjects => {
  const api = useApi(komodorApiRef);
  const getObjects = useCallback(async (): Promise<WorkloadInstanceInfo[]> => {
    const workloads: Array<WorkloadInstanceInfo> = [];
    // Prevents a default filter request.
    if (
      filter &&
      filter.name !== API_QUERY_PARAM_DEFAULT_VALUE &&
      filter.namespace !== API_QUERY_PARAM_DEFAULT_VALUE
    ) {
      if (filter.uuids.length > 0) {
        for (const uuid of filter.uuids) {
          workloads.push(
            ...(await api.getWorkloadInstances({
              workload_name: API_QUERY_PARAM_DEFAULT_VALUE,
              workload_namespace: API_QUERY_PARAM_DEFAULT_VALUE,
              workload_uuid: uuid,
            })),
          );
        }
      }
      // No UUIDs? Uses name and namespace instead.
      else {
        workloads.push(
          ...(await api.getWorkloadInstances({
            workload_name: filter.name,
            workload_namespace: filter.namespace,
            workload_uuid: API_QUERY_PARAM_DEFAULT_VALUE,
          })),
        );
      }
    }

    return workloads;
  }, [api, filter]);

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
