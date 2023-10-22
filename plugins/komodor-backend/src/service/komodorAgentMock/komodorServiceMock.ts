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

const express = require('express');

const app = express();
const port = 7008;

const cache = new Map();

cache.set('my_workload_uuidA', {
  data: {
    items: [
      {
        workloadName: 'my_workload_name1A',
        workloadNamespace: 'my_workload_namespace1A',
        serviceInstances: [
          {
            clusterName: 'my_workload_cluster_name1_1A',
            status: 'Healthy',
            workloadUUID: 'my_workload_uuidA',
          },
          {
            clusterName: 'my_workload_cluster_name1_2A',
            status: 'Unhealthy',
            workloadUUID: 'my_workload_uuidA',
          },
          {
            clusterName: 'my_workload_cluster_name1_3A',
            status: 'Healthy',
            workloadUUID: 'my_workload_uuidA',
          },
        ],
      },
      {
        workloadName: 'my_workload_name2A',
        workloadNamespace: 'my_workload_namespace1A',
        serviceInstances: [
          {
            clusterName: 'my_workload_cluster_name2_1A',
            status: 'Healthy',
            workloadUUID: 'my_workload_uuidA',
          },
          {
            clusterName: 'my_workload_cluster_name2_2A',
            status: 'Healthy',
            workloadUUID: 'my_workload_uuidA',
          },
          {
            clusterName: 'my_workload_cluster_name2_3A',
            status: 'Healthy',
            workloadUUID: 'my_workload_uuidA',
          },
        ],
      },
    ],
  },
});

cache.set('my_workload_uuidB', {
  data: {
    items: [
      {
        workloadName: 'my_workload_name1B',
        workloadNamespace: 'my_workload_namespace1B',
        serviceInstances: [
          {
            clusterName: 'my_workload_cluster_name1_1B',
            status: 'Healthy',
            workloadUUID: 'my_workload_uuidB',
          },
          {
            clusterName: 'my_workload_cluster_name1_2B',
            status: 'Healthy',
            workloadUUID: 'my_workload_uuidB',
          },
          {
            clusterName: 'my_workload_cluster_name1_3B',
            status: 'Healthy',
            workloadUUID: 'my_workload_uuidB',
          },
          {
            workloadName: 'my_workload_name2B',
            workloadNamespace: 'my_workload_namespace1B',
            serviceInstances: [
              {
                clusterName: 'my_workload_cluster_name2_1B',
                status: 'Healthy',
                workloadUUID: 'my_workload_uuidB',
              },
              {
                clusterName: 'my_workload_cluster_name2_2B',
                status: 'Healthy',
                workloadUUID: 'my_workload_uuidB',
              },
              {
                clusterName: 'my_workload_cluster_name2_3B',
                status: 'Healthy',
                workloadUUID: 'my_workload_uuidB',
              },
            ],
          },
        ],
      },
    ],
  },
});

app.get('/workload', (req, res) => {
  const {
    workloadName = 'default',
    workloadNamespace = 'default',
    workloadUUID = 'default',
  } = req.query;
  const dataPerUUID = cache.get(workloadUUID);
  let requestedData;

  if (dataPerUUID) {
    requestedData = dataPerUUID.data.items.find(
      item =>
        item.workloadName === workloadName &&
        item.workloadNamespace === workloadNamespace,
    );
  }

  const status = requestedData ? 200 : 204;
  const responseJSON = requestedData ? requestedData.serviceInstances : '';

  res.status(status).json(responseJSON);
});

app.get('*', (req, res) => {
  res.status(404).json({ message: 'Not Found' });
});

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
