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

cache.set('63ac5c15-3342-498d-a9e9-c2bb72577bbd', {
  workloadName: 'my_workload_name1A',
  workloadNamespace: 'my_workload_namespace1A',
  clusterName: 'local',
  status: 'Healthy',
  workloadUUID: '63ac5c15-3342-498d-a9e9-c2bb72577bbd',
});

cache.set('992b5d96-a6c3-4dbd-8a21-4238ce8d8010', {
  workloadName: 'my_workload_name1B',
  workloadNamespace: 'my_workload_namespace1A',
  clusterName: 'local',
  status: 'Unhealthy',
  workloadUUID: '992b5d96-a6c3-4dbd-8a21-4238ce8d8010',
});

cache.set('ef9a01d9-2854-4bfd-959e-91427afbadf6', {
  workloadName: 'my_workload_name1A',
  workloadNamespace: 'my_workload_namespace1A',
  clusterName: 'local',
  status: 'Healthy',
  workloadUUID: 'ef9a01d9-2854-4bfd-959e-91427afbadf6',
});

app.get('/workload', (req, res) => {
  const {
    workload_name = '!default!',
    workload_namespace = '!default!',
    workload_uuid = '!default!',
  } = req.query;
  console.log(req.query);
  const dataPerUUID = cache.get(workload_uuid);
  let requestedData;

  if (
    dataPerUUID &&
    workload_name === '!default!' &&
    workload_namespace === '!default!'
  ) {
    if (workload_uuid !== '!default!') {
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
