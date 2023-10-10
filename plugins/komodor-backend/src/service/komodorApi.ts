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

import { NotImplementedError } from '@backstage/errors';
import { fetchWithTimeout } from './fetchHelper';
import {
  KomodorApiRequestInfo,
  KomodorApiRequestInfoBase,
  KomodorApiResponseInfo,
  KomodorApiResponseInfoBase,
} from '../types/types';

const REQUEST_TIMEOUT = 300;
const KOMODOR_API: string = 'workload';

/**
 * General info for the requests of the API
 */
export interface KomodorApiInfo {
  apiKey: string;
  url: string;
  timeout?: number;
  options?: {};
}

/**
 * A base class for KomodorApi.
 */
export interface KomodorApiBase<
  T extends KomodorApiRequestInfoBase,
  K extends KomodorApiResponseInfoBase,
> {
  fetchAll(): Promise<Array<Array<K>>>;
  fetch(params: T): Promise<Array<K>>;
}

/*
 * Fetching data with custom headers and query
 */
export class KomodorApi
  implements KomodorApiBase<KomodorApiRequestInfo, KomodorApiResponseInfo>
{
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

  async fetchAll(): Promise<Array<Array<KomodorApiResponseInfo>>> {
    throw new NotImplementedError();
  }

  async fetch(
    params: KomodorApiRequestInfo,
  ): Promise<Array<KomodorApiResponseInfo>> {
    const headers = {
      authorization: `Bearer ${this.apiKey}`,
      method: 'POST',
      ...this.options,
    };

    const queryParams: URLSearchParams = new URLSearchParams({
      workloadName: params.workloadName,
      workloadNamespace: params.workloadNamespace,
      workloadUUID: params.workloadUUID,
    });

    const path: string = `${KOMODOR_API}?${queryParams}`;
    const fetchURL: URL = new URL(path, this.url);

    const response = await fetchWithTimeout(
      fetchURL.toString(),
      this.timeout,
      headers,
    );

    return (await response.json()) as Array<KomodorApiResponseInfo>;
  }
}
