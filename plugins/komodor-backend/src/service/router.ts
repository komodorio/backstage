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
import { CacheOptions } from './serviceCache';

export interface RouterOptions {
  logger: Logger;
  config: Config;
}

/**
 * Creates a Komodor worker with a given config.
 * @param config
 * @returns
 */
export function createKomodorWorker(config: Config): KomodorWorker {
  /**
   * Parameters that will cause an exception intentionally if not configured properly.
   * They are mandatory!
   */
  const apiKey: string = config.getString('komodor.apiKey');
  const url: string = config.getString('komodor.url');

  /**
   * Optional parameters
   */
  const shouldFetch: boolean = config.has('komodor.cache.shouldFetch')
    ? config.getString('komodor.cache.shouldFetch') === 'true'
    : false;

  const shouldUpdate: boolean = config.has('komodor.cache.shouldUpdate')
    ? config.getString('komodor.cache.shouldUpdate') === 'true'
    : false;

  const cacheOptions: CacheOptions = {
    shouldFetch: shouldFetch,
    shouldUpdate: shouldUpdate,
  };

  return new KomodorWorker({ apiKey, url, cacheOptions });
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
