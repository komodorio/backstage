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
import { ServiceStatus } from '../types/types';
import { useEntity } from '@backstage/plugin-catalog-react';
import { MissingAnnotationEmptyState } from '@backstage/core-components';
import { KOMODOR_ID_ANNOTATION, isKomodorAvailable } from '../plugin';
import { EntityKomodorServiceWarningCard } from './warnings';
import { useServiceInstancesFetcher } from '../hooks';

const columns: TableColumn[] = [
  {
    title: 'Cluster Name',
    field: 'clusterName',
    highlight: true,
  },
  {
    title: 'Workload UUID',
    field: 'workloadUUID',
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
  const { objects, error } = useServiceInstancesFetcher(entity);
  const [lastObjects, setLastObjects] = useState(objects);

  useEffect(() => {
    if (objects) {
      setLastObjects(objects);
    }
  }, [objects]);

  if (!isKomodorAvailable(entity)) {
    return <MissingAnnotationEmptyState annotation={KOMODOR_ID_ANNOTATION} />;
  }

  const mapData = (): {
    clusterName: string;
    isHealthy: boolean;
    workloadUUID: string;
    icon: string;
  }[] => {
    if (objects === null && objects === undefined) {
      return [];
    } else if (error) {
      return (
        lastObjects?.map(instance => {
          return {
            clusterName: instance.clusterName,
            isHealthy: instance.status === ServiceStatus.Healthy,
            workloadUUID: instance.workloadUUID,
            icon: '■',
          };
        }) ?? []
      );
    }
    return (
      objects?.map(instance => {
        return {
          clusterName: instance.clusterName,
          isHealthy: instance.status === ServiceStatus.Healthy,
          workloadUUID: instance.workloadUUID,
          icon: '■',
        };
      }) ?? []
    );
  };

  const data = mapData();

  return (
    <>
      {error ? (
        <EntityKomodorServiceWarningCard
          title="An error occurred in the server"
          message={error}
        />
      ) : (
        <></>
      )}
      <Table
        options={{ paging: false }}
        data={data}
        columns={columns}
        title="Service Instances"
        isLoading={objects === null}
      />
    </>
  );
}
