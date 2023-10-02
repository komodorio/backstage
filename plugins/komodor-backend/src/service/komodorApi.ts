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

import { AgentDetailsBase, ClusterDetails } from '../types/types';
import { NotImplementedError } from '@backstage/errors';
import fetch from 'node-fetch';

const REQUEST_TIMEOUT = 5000;

export interface KomodorApiInfo {
  apiKey: string;
  url: string;
}

export interface KomodorApiBase {
  fetchAll(): AgentDetailsBase;
}

/*
 * Fetching data with custom headers and query
 */
export class KomodorApi implements KomodorApiBase {
  private apiKey: string;
  private url: string;

  constructor(apiInfo: KomodorApiInfo) {
    const { apiKey, url } = apiInfo;

    this.apiKey = apiKey;
    this.url = url;
  }

  fetchAll(): AgentDetailsBase {
    throw new NotImplementedError();
  }

  async fetch(clusterDetails: ClusterDetails[]) {
    const headers = {
      authorization: `Bearer ${this.apiKey}`,
      timeout: REQUEST_TIMEOUT,
    };

    const request = {
      clusters: clusterDetails,
    };

    return await this.fetchWithTimeout(
      this.url.concat(JSON.stringify(request)),
      headers,
    );
  }

  private async fetchWithTimeout(resource: string, options = {}) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    const response = await fetch(resource, {
      ...options,
      signal: controller.signal,
    });

    clearTimeout(id);

    return response;
  }
}
