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
import { fetchWithTimeout } from './fetchHelper';

const REQUEST_TIMEOUT = 5000;

export interface KomodorApiInfo {
  apiKey: string;
  url: string;
  timeout?: number;
  options?: {};
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
  private timeout: number;
  private options?: {};

  constructor(apiInfo: KomodorApiInfo) {
    const { apiKey, url, timeout, options } = apiInfo;

    this.apiKey = apiKey;
    this.url = url;
    this.timeout = timeout ?? REQUEST_TIMEOUT;
    this.options = options;
  }

  fetchAll(): AgentDetailsBase {
    throw new NotImplementedError();
  }

  async fetch(clusterDetails: ClusterDetails[]) {
    const headers = {
      authorization: `Bearer ${this.apiKey}`,
      ...this.options,
    };

    const request = {
      clusters: clusterDetails,
    };

    return await fetchWithTimeout(
      this.url.concat(JSON.stringify(request)),
      this.timeout,
      headers,
    );
  }
}
