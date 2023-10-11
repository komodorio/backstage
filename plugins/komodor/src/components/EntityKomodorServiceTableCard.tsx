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
import { Table, TableColumn } from '@backstage/core-components';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ServiceInstancesResponseInfo, ServiceStatus } from '../types/types';
import { useEntity } from '@backstage/plugin-catalog-react';
import { useServiceInstancesFetcher, komodorApiRef } from '../api';
import { MissingAnnotationEmptyState } from '@backstage/core-components';
import { useApi } from '@backstage/core-plugin-api';
import { KOMODOR_ID_ANNOTATION, isKomodorAvailable } from '../plugin';

const columns: TableColumn[] = [
  {
    title: 'Cluster Name',
    field: 'clusterName',
    highlight: true,
  },
  {
    title: 'Workload UUID',
    field: 'link',
    highlight: true,
  },
  {
    title: 'Status',
    field: 'icon',
    highlight: true,
    cellStyle: (_, rowData: any) => {
      return {
        color: rowData.isHealthy ? '#6CD75F' : '#DC3D5A',
        fontSize: '36px',
      };
    },
  },
  /** {
    title: 'Available Containers',
    field: 'availability',
  },*/
];

export function EntityKomodorServiceTableCard() {
  const { entity } = useEntity();
  const api = useApi(komodorApiRef);
  const { fetcher } = useServiceInstancesFetcher(entity, api);

  const [serviceInstances, setServiceInstances] =
    useState<ServiceInstancesResponseInfo | null>(null);

  const onError = useCallback(
    (error: string) => {
      fetcher?.stopPeriodicFetching();
    },
    [fetcher],
  );

  useEffect(() => {
    if (isKomodorAvailable(entity) && fetcher !== undefined) {
      // Each time the component is mounted, the data is fetched (constantly).
      fetcher.getServiceInstancesPeriodically(updateServiceInstances, onError);
    }
  }, [fetcher, onError, entity]);

  if (!isKomodorAvailable(entity)) {
    return <MissingAnnotationEmptyState annotation={KOMODOR_ID_ANNOTATION} />;
  }

  const data = (): {
    clusterName: string;
    isHealthy: boolean;
    workloadUUID: string;
    icon: string;
  }[] => {
    if (serviceInstances === null) return [];

    return serviceInstances.items.map(instance => {
      return {
        clusterName: instance.clusterInfo,
        isHealthy: instance.status === ServiceStatus.Healthy,
        workloadUUID: instance.workloadUUID,
        icon: '■',
      };
    });
  };

  function updateServiceInstances(
    serviceInstancesFetch: ServiceInstancesResponseInfo,
  ) {
    setServiceInstances(serviceInstancesFetch);
  }

  return (
    <Table
      options={{ paging: false }}
      data={data()}
      columns={columns}
      title="Service Instances"
      isLoading={serviceInstances === null}
    />
  );
}
