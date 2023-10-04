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

import express from 'express';
import { KomodorApi } from './komodorApi';
import { ClusterLocatorConfig } from '../config/clusterLocatorConfig';

const POLLING_INTERVAL = 2000;

/*
 * Represents a server-side events client
 */
export interface SSEClient {
  request: express.Request;
  response: express.Response;
}

export interface KomodorWorkerInfo {
  apiKey: string;
  url: string;
  locator: ClusterLocatorConfig;
}

/*
 Polls the agent and updates connected clients.
 */
export class KomodorWorker {
  private clients: SSEClient[] = [];
  private api: KomodorApi;
  private locator: ClusterLocatorConfig;
  private signal: boolean = false;

  constructor(workerInfo: KomodorWorkerInfo) {
    const { apiKey, url, locator } = workerInfo;

    this.api = new KomodorApi({ apiKey, url });
    this.locator = locator;
  }

  addClient(client: SSEClient) {
    const { request, response } = client;

    request.headers['Content-Type'] = 'text/event-stream';
    request.headers['Cache-Control'] = 'no-cache';
    request.headers.Connection = 'keep-alive';

    response.setHeader('Content-Type', 'text/event-stream');

    if (client.request.socket.localAddress) {
      let exists: boolean = false;

      for (const existingClient of this.clients) {
        if (
          existingClient.request.socket.remoteAddress ===
          client.request.socket.remoteAddress
        ) {
          exists = true;
          response.end();
        }
      }

      if (!exists) {
        this.clients.push(client);
      }
    }

    // Remove the client when the connection closes
    request.on('close', () => {
      console.log(`${client.request.socket.remoteAddress} leaves.`);
      const index = this.clients.indexOf(client);
      if (index !== -1) {
        this.clients.splice(index, 1);
      }
    });
  }

  async start() {
    this.signal = false;

    while (!this.signal) {
      try {
        const response = await this.api.fetch(this.locator.clusters);

        if (response.status !== 404) {
          this.sendUpdates(await response.json());
        }
      } catch (error) {
        console.error('Error while polling:', error);
      }

      // Polling interval delay
      await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL));
    }
  }

  stop() {
    this.signal = true;
  }

  private sendUpdates(data: any) {
    // Send updates to all connected clients
    this.clients.forEach(client => {
      client.response.write(`data: ${JSON.stringify(data)}\n\n`);
      client.response.end();
    });
  }
}
