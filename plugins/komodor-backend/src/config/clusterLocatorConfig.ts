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

import { ClusterDetails } from '../types/types';

/*
 * When fetching data, this format is used for the protocol.
 */
export interface ClusterLocatorConfig {
  clusters: ClusterDetails[];
}

export const toClusterLocatorConfig = (configString: string) => {
  const clusters: ClusterDetails[] = [];
  const parsedJson = JSON.parse(configString);

  for (let objectIndex = 0; objectIndex < parsedJson.length; objectIndex++) {
    clusters.push(parsedJson[objectIndex]);
  }

  return { clusters };
};
