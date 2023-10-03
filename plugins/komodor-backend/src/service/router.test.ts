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
import { getVoidLogger } from '@backstage/backend-common';
import express from 'express';
import request from 'supertest';
import { createRouter } from './router';
import { ConfigReader } from '@backstage/config';

const configMock = {
  komodor: {
    apiKey: process.env.API_KEY_MOCK ?? '12345',
    url: process.env.URL ?? 'http://localhost:3001',
    clusters: [
      {
        name: 'cluster-a',
        services: [
          {
            name: 'cluster-a-service-a',
          },
          {
            name: 'cluster-a-service-b',
          },
        ],
      },
      {
        name: 'cluster-b',
        services: [
          {
            name: 'cluster-b-service-a',
          },
          {
            name: 'cluster-b-service-b',
          },
        ],
      },
    ],
  },
};

describe('createRouter', () => {
  let app: express.Express;

  beforeAll(async () => {
    const router = await createRouter({
      logger: getVoidLogger(),
      config: new ConfigReader(configMock),
    });
    app = express().use(router);
  });

  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('GET /join', () => {
    it('returns ok', async () => {
      const response = await request(app).get('/join');

      expect(response.status).toEqual(200);
      expect(response.body).toEqual({ status: 'ok' });
    });
  });
});
