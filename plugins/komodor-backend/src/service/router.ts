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

let komodorWorker: KomodorWorker;

export interface RouterOptions {
  logger: Logger;
  config: Config;
}

export async function createRouter(
  options: RouterOptions,
): Promise<express.Router> {
  const { logger, config } = options;

  // This won't be stored here..
  const apiKey: string = config.getString('komodor.apiKey');
  const url: string = config.getString('komodor.url');
  const locator: ClusterLocatorConfig = toClusterLocatorConfig(
    config.getString('komodor.clusters'),
  );

  const router = Router();
  komodorWorker = new KomodorWorker({ apiKey, url, locator });

  router.use(express.json());

  router.get('/health', (_, response) => {
    logger.info('PONG!');
    response.json({ status: 'ok' });
  });

  router.get('/join', (req, res) => {
    // Once a client ahs loaded it sends this request, that lets them into the
    // komodor status update group.
    komodorWorker.addClient({ request: req, response: res });
  });

  router.use(errorHandler());
  komodorWorker.start();

  return router;
}
