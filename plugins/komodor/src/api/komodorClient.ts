/*
 * Copyright 2022 The Backstage Authors
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

import { DiscoveryApi, IdentityApi } from '@backstage/core-plugin-api';
import { ResponseError } from '@backstage/errors';
import { KomodorApi } from './komodorApi';
import {
  WorkloadDetailsRequestInfo,
  WorkloadInstanceInfo,
} from '../types/types';

const PLUGIN_ID: string = 'komodor';
const PATH: string = 'workload';

export class KomodorClient implements KomodorApi {
  private readonly discoveryApi: DiscoveryApi;
  private readonly identityApi: IdentityApi;

  public constructor(options: {
    discoveryApi: DiscoveryApi;
    identityApi: IdentityApi;
  }) {
    this.discoveryApi = options.discoveryApi;
    this.identityApi = options.identityApi;
  }

  /**
   * Fetches the info about the service instances by the service name
   * @param baseUrl The base of the URL
   * @param serviceName The name of the service
   * @returns Info about the service instances
   */
  public async getWorkloadInstances(
    info: WorkloadDetailsRequestInfo,
  ): Promise<WorkloadInstanceInfo[]> {
    try {
      const { workload_name, workload_namespace, workload_uuid } = info;

      const path: URLSearchParams = new URLSearchParams({
        workload_name: workload_name ?? 'default',
        workload_namespace: workload_namespace ?? 'default',
        workload_uuid: workload_uuid ?? '',
      });

      const items = await this.get<any>(
        `/${PATH}?`.concat(`${path.toString()}`),
      );

      return items;
    } catch (error) {
      throw error;
    }
  }

  /**
   * A more generic fetching method
   */
  private async get<T>(path: string): Promise<T> {
    const baseUrl = `${await this.discoveryApi.getBaseUrl(`${PLUGIN_ID}`)}`;
    const url = baseUrl.concat(path);
    const { token } = await this.identityApi.getCredentials();
    const response = await fetch(url.toString(), {
      headers: token ? { komodorToken: `${token}` } : {},
    });

    if (!response.ok) {
      throw await ResponseError.fromResponse(response);
    }

    return response.json() as Promise<T>;
  }
}
