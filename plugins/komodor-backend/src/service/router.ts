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

export interface RouterOptions {
  logger: Logger;
  config: Config;
}

export function createKomodorWorker(config: Config): KomodorWorker {
  const apiKey: string = config.getString('komodor.apiKey');
  const url: string = config.getString('komodor.url');

  return new KomodorWorker({ apiKey, url });
}

export async function createRouter(
  options: RouterOptions,
): Promise<express.Router> {
  const { config } = options;

  const router = Router();
  const komodorWorker = createKomodorWorker(config);
  komodorWorker.start();

  router.use(express.json());
  router.get('/ping', (req, res) => {
    res.status(200).json({ message: 'hello' });
  });
  router.get('/services', (req, res) => {
    komodorWorker.getServiceInfo(req, res);
  });

  router.use(errorHandler());

  return router;
}
