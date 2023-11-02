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
import React from 'react';
import { EntityKomodorWorkloadTableCard } from './EntityKomodorWorkloadTableCard';
import { EntityProvider } from '@backstage/plugin-catalog-react';
import { TestApiProvider, renderInTestApp } from '@backstage/test-utils';
import { KomodorApi, komodorApiRef } from '../api';
import { WorkloadInstanceInfo } from '../types/types';

describe('EntityKomodorWorkloadTableCard', () => {
  const entity = {
    apiVersion: 'v1',
    kind: 'Component',
    metadata: {
      name: 'software',
      description: 'This is the description',
      annotations: {
        'komodor.io/komodor-entity-id': 'uuid1',
        'komodor.io/workload-name': 'my_workload_name',
        'komodor.io/workload-namespace': 'my_workload_namespace',
      },
    },
  };

  const komodorApi: Partial<KomodorApi> = {
    getWorkloadInstances: () =>
      Promise.resolve([
        { cluster_name: 'cname1', workload_uuid: 'uuid1', status: 'Healthy' },
      ] as WorkloadInstanceInfo[]),
  };

  it('Show the table', async () => {
    const { getByText } = await renderInTestApp(
      <TestApiProvider apis={[[komodorApiRef, komodorApi]]}>
        <EntityProvider entity={entity}>
          <EntityKomodorWorkloadTableCard />
        </EntityProvider>
      </TestApiProvider>,
    );

    expect(getByText('uuid1')).toBeInTheDocument();
  });
});
