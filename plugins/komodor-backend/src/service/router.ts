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
import { errorHandler } from '@backstage/backend-common';
import express from 'express';
import Router from 'express-promise-router';
import { KomodorWorker } from './komodorWorker';
import { Config } from '@backstage/config';
import { Logger } from 'winston';
import {
  ClusterLocatorConfig,
  toClusterLocatorConfig,
} from '../config/clusterLocatorConfig';

export interface RouterOptions {
  logger: Logger;
  config: Config;
}

export function createKomodorWorker(config: Config): KomodorWorker {
  const apiKey: string = config.getString('komodor.apiKey');
  const url: string = config.getString('komodor.url');
  const locator: ClusterLocatorConfig = toClusterLocatorConfig(
    config.getString('komodor.clusters'),
  );

  return new KomodorWorker({ apiKey, url, locator });
}

export async function createRouter(
  options: RouterOptions,
): Promise<express.Router> {
  const { config } = options;

  const router = Router();
  const komodorWorker = createKomodorWorker(config);

  router.use(express.json());
  router.get('/join', (req, res) => {
    // Once a client has loaded it sends this request, that adds them to
    // the collection of clients that need to be updated.
    komodorWorker.addClient({ request: req, response: res });
  });

  router.use(errorHandler());
  komodorWorker.start();

  return router;
}
