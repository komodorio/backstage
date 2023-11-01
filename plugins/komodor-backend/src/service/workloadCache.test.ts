import { WorkloadCache, Workload } from './workloadCache';
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

describe('WorkloadCache', () => {
  let workloadCache: WorkloadCache;

  beforeEach(() => {
    workloadCache = new WorkloadCache();
  });

  it('should initialize with the provided cache', () => {
    // Notice these two do not share the same reference!
    expect(workloadCache.toMap()).toEqual(new Map<string, Workload>());
  });

  it('should return undefined because the cache is empty', () => {
    expect(workloadCache.getWorkloadByUUID('uuid1')).toBeUndefined();
  });

  it('should return [] because the cache is empty', () => {
    const params = {
      name: 'name1',
      namespace: 'namespace1',
    };

    const dataItem = workloadCache.getWorkloads(
      workload =>
        workload.name === params.name &&
        workload.namespace === params.namespace,
    );
    expect(dataItem).toEqual([]);
  });

  it('should set data item in cache', () => {
    const workload: Workload = {
      uuid: 'uuid2',
      name: 'name2',
      namespace: 'namespace2',
      clusterName: 'cname2',
      status: 'Unhealthy',
      lastUpdateRequest: Date.now(),
    };

    workloadCache.setWorkload(workload);

    const cachedData = workloadCache.toMap().get('uuid2');
    expect(cachedData).not.toBeUndefined();
    expect(cachedData).toEqual(workload);
  });

  it('should return workloads by name and namespace if exist', () => {
    const firstWorkload: Workload = {
      uuid: 'uuid1',
      name: 'name1',
      namespace: 'namespace1',
      clusterName: 'cname1',
      status: 'Unhealthy',
      lastUpdateRequest: Date.now(),
    };

    const secondWorkload: Workload = {
      uuid: 'uuid2',
      name: 'name1',
      namespace: 'namespace1',
      clusterName: 'cname2',
      status: 'Unhealthy',
      lastUpdateRequest: Date.now(),
    };

    workloadCache.setWorkload(firstWorkload);
    workloadCache.setWorkload(secondWorkload);

    const result = workloadCache.getWorkloads(
      workload =>
        workload.name === firstWorkload.name &&
        workload.namespace === firstWorkload.namespace,
    );

    expect(result[0]).toEqual(firstWorkload);
    expect(result[1]).toEqual(secondWorkload);
  });

  it('should return workload by UUID if it exists', () => {
    const workload: Workload = {
      uuid: 'uuid1',
      name: 'name1',
      namespace: 'namespace1',
      clusterName: 'cname1',
      status: 'Unhealthy',
      lastUpdateRequest: Date.now(),
    };

    workloadCache.setWorkload(workload);

    const result = workloadCache.getWorkloadByUUID(workload.uuid);
    expect(result).toEqual(workload);
  });

  it('should remove data item from cache', () => {
    const workload: Workload = {
      uuid: 'uuid1',
      name: 'name1',
      namespace: 'namespace1',
      clusterName: 'cname1',
      status: 'Unhealthy',
      lastUpdateRequest: Date.now(),
    };

    workloadCache.setWorkload(workload);
    const removed = workloadCache.removeWorkload(workload.uuid);
    expect(removed).toBe(true);
    expect(workloadCache.toMap().has(workload.uuid)).toBe(false);
  });

  it('should not remove non-existing data item from cache', () => {
    const removed = workloadCache.removeWorkload('uuid0');
    expect(removed).toBe(false);
  });

  it('should iterate over all items in the cache', async () => {
    const firstWorkload: Workload = {
      uuid: 'uuid1',
      name: 'name1',
      namespace: 'namespace1',
      clusterName: 'cname1',
      status: 'Unhealthy',
      lastUpdateRequest: Date.now(),
    };

    const secondWorkload: Workload = {
      uuid: 'uuid2',
      name: 'name1',
      namespace: 'namespace1',
      clusterName: 'cname2',
      status: 'Unhealthy',
      lastUpdateRequest: Date.now(),
    };

    workloadCache.setWorkload(firstWorkload);
    workloadCache.setWorkload(secondWorkload);

    const callback = jest.fn(async _workload => true);
    await workloadCache.forEach(callback);

    // Ensure the callback was called for each item
    expect(callback).toHaveBeenCalledTimes(2);
    expect(callback).toHaveBeenNthCalledWith(1, firstWorkload);
    expect(callback).toHaveBeenNthCalledWith(2, secondWorkload);
  });
});
