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
  workloadName: 'my_workload_name1A',
  workloadNamespace: 'my_workload_namespace1A',
  clusterName: 'my_workload_cluster_name1_1A',
  status: 'Healthy',
  workloadUUID: 'my_workload_uuidA',
});

cache.set('my_workload_uuidB', {
  workloadName: 'my_workload_name1B',
  workloadNamespace: 'my_workload_namespace1A',
  clusterName: 'my_workload_cluster_name1_1A',
  status: 'Unhealthy',
  workloadUUID: 'my_workload_uuidB',
});

cache.set('my_workload_uuidC', {
  workloadName: 'my_workload_name1A',
  workloadNamespace: 'my_workload_namespace1A',
  clusterName: 'my_workload_cluster_name1_1C',
  status: 'Healthy',
  workloadUUID: 'my_workload_uuidC',
});

app.get('/workload', (req, res) => {
  const {
    workload_name = 'default',
    workload_namespace = 'default',
    workload_uuid = 'default',
  } = req.query;
  console.log(req.query);
  const dataPerUUID = cache.get(workload_uuid);
  let requestedData;

  if (dataPerUUID) {
    if (workload_uuid !== 'default') {
      // No need to filter as there's only one workload with this UUID.
      requestedData = [dataPerUUID];
    }
  } else {
    requestedData = [...cache.values()].filter(
      item =>
        item.workloadName === workload_name &&
        item.workloadNamespace === workload_namespace,
    );
  }

  const status = 200;
  const responseJSON =
    requestedData?.map(function (item) {
      return {
        cluster_name: item.clusterName,
        status: item.status,
        workload_uuid: item.workloadUUID,
      };
    }) ?? [];

  console.log(JSON.stringify(responseJSON));

  res.status(status).json(responseJSON);
});

app.get('*', (req, res) => {
  res.status(404).json({ message: 'Not Found' });
});

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
