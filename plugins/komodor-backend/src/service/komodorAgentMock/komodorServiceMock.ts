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
import http from 'http';

const port = 7008;

const server = http.createServer((req, res) => {
  if (req.method === 'GET' && req.url?.startsWith('/data')) {
    console.log(`${req.socket.remoteAddress} asks for data!`);
    const data = {
      name: 'cluster-a',
      services: [
        {
          name: 'service-a-cluster-a',
          status: 'Healthy',
          availablePods: 12,
          totalPods: 12,
        },
      ],
    };

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.write(JSON.stringify(data));
    res.end();
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

server.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
