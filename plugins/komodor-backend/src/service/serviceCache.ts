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

export interface Workload {
  uuid: string;
  name: string;
  namespace: string;
  clusterName: string;
  status: string;
  lastUpdateRequest: number;
}

/**
 * Options for accessing the cache
 */
export interface CacheOptions {
  /**
   * Should data be fetched from the cache if exists
   */
  shouldFetch: boolean;

  /**
   * Should the cache be updated constantly in the backgroung.
   */
  shouldUpdate: boolean;
}

/** *
 * A cache for services data
 */
export class WorkloadCache {
  private cache: Map<string, Workload>;

  /**
   * Creates a new cache
   * @param cache Data source from old caches. If not set, create an empty cache.
   */
  constructor(cache?: WorkloadCache) {
    this.cache = cache
      ? new Map<string, Workload>(cache?.cache)
      : new Map<string, Workload>();
  }

  /**
   * Creates a map out of the current cache
   * @returns Returns a new Map with the data from the current cache.
   */
  toMap(): Map<string, Workload> {
    return new Map<string, Workload>(this.cache);
  }

  /**
   * Gets the workload by its UUID.
   * @param params Request's parameters.
   * @returns Returns the desired service.
   */
  getWorkloadByUUID(uuid: string): Workload | undefined {
    return this.cache.get(uuid);
  }

  /**
   * Gets the workload by a predicate.
   * For looking up a workload by UUID, @see getWorkloadByUUID
   * @param params Request's parameters.
   * @returns Returns the desired service.
   */
  getWorkloads(predicate: (workload: Workload) => boolean): Workload[] {
    return [...this.cache.values()].filter(predicate);
  }

  /**
   * Updates/stores the workload.
   * @param workload The workload to store/update, matching by UUID
   * @param setDate Sets the date if desired.
   * @returns True if succeeded.
   */
  setWorkload(workload: Workload, setDate: boolean = true) {
    const item = this.getWorkloadByUUID(workload.uuid);

    if (item) {
      item.clusterName = workload.clusterName;
      item.status = workload.status;

      if (setDate) {
        item.lastUpdateRequest = Date.now();
      }
    } else {
      this.cache.set(workload.uuid, workload);
    }
  }

  /**
   * Removes a workload
   * @param uuid Workload UUID
   * @returns True if the operation succeeded, false if not (possibly not found).
   */
  removeWorkload(uuid: string): boolean {
    return this.cache.delete(uuid);
  }

  /**
   * Goes through all the items in all the entries in the map.
   * @param callback Function to call with an item loaded. It should return false
   * only if a loop break is required, for example, if an exception is raised in a callback.
   */
  forEach(callback: (workload: Workload) => Promise<boolean>) {
    for (const value of this.cache.values()) {
      // This can happen when the callback throws so the iteration needs to stop
      if (!callback(value)) {
        break;
      }
    }
  }
}
