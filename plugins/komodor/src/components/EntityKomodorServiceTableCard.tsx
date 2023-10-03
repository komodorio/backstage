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
import React, { useEffect, useState } from 'react';
import { ClusterDetails, ServiceStatus } from '../types/types';
import { useApi, configApiRef } from '@backstage/core-plugin-api';

const columns: TableColumn[] = [
  {
    title: 'Name',
    field: 'name',
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
  {
    title: 'Available Containers',
    field: 'availability',
  },
];

export function EntityKomodorServiceTableCard() {
  const config = useApi(configApiRef);
  const [clusterDetails, setClusterDetails] = useState<ClusterDetails | null>(
    null,
  );

  const data = (): {
    name: string;
    isHealthy: boolean;
    availability: string;
    icon: string;
  }[] => {
    if (clusterDetails === null) return [];

    return clusterDetails!.services.map(cluster => {
      return {
        name: cluster.name,
        isHealthy: cluster.status === ServiceStatus.Healthy,
        availability: `${cluster.availablePods}/${cluster.totalPods}`,
        icon: '■',
      };
    });
  };

  useEffect(() => {
    const URL = config.getString('komodor.baseUrl');

    const eventSource = new EventSource(URL, {
      withCredentials: true,
    });

    eventSource.onmessage = event => {
      if (event.data === undefined) return;
      const json = JSON.parse(event.data);

      if (json === undefined) return;
      setClusterDetails(json);
    };
  }, [config]);

  return (
    <Table
      options={{ paging: false }}
      data={data()}
      columns={columns}
      title="Services"
      isLoading={clusterDetails === null}
    />
  );
}
