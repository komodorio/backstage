import { ServiceCache, ServiceCacheItem } from './serviceCache';
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

describe('ServiceCache', () => {
  let serviceCache: ServiceCache;

  beforeEach(() => {
    serviceCache = new ServiceCache();
  });

  it('should initialize with the provided cache', () => {
    // Notice these do not share the same reference!
    expect(serviceCache.toMap()).toEqual(new Map<string, ServiceCacheItem>());
  });

  it('should return undefined because the cache is empty', () => {
    const params = {
      workloadUUID: 'uuid1',
      workloadName: 'name1',
      workloadNamespace: 'namespace1',
    };

    const mockData = [
      {
        requestInfo: params,
        responseInfo: [
          {
            workloadUUID: 'uuid1',
            clusterName: 'cname1',
            status: 'Healthy',
          },
        ],
        lastUpdateRequest: Date.now(),
      },
    ];

    const dataItem = serviceCache.getDataItem(params);
    expect(dataItem).toEqual(undefined);
  });

  it('should set data item in cache', () => {
    const params = {
      workloadUUID: 'uuid2',
      workloadName: 'name2',
      workloadNamespace: 'namespace2',
    };
    const responseData = [
      {
        workloadUUID: 'uuid2',
        clusterName: 'cname2',
        status: 'Unhealthy',
      },
    ];

    serviceCache.setDataItem(params, responseData);

    const cachedData = serviceCache.toMap().get('uuid2');
    expect(cachedData).not.toBeUndefined();
    expect(cachedData?.data.items).toHaveLength(1);
    expect(cachedData?.data.items[0].requestInfo).toEqual(params);
    expect(cachedData?.data.items[0].responseInfo).toEqual(responseData);
  });

  it('should return data item if it exists', () => {
    const params = {
      workloadUUID: 'uuid1',
      workloadName: 'name1',
      workloadNamespace: 'namespace1',
    };

    const mockData = [
      {
        requestInfo: params,
        responseInfo: [
          {
            workloadUUID: 'uuid1',
            clusterName: 'cname1',
            status: 'Healthy',
          },
        ],
        lastUpdateRequest: Date.now(),
      },
    ];

    serviceCache.setDataItem(params, mockData[0].responseInfo);

    const dataItem = serviceCache.getDataItem(params);
    expect(dataItem).toEqual(mockData[0]);
  });

  it('should remove data item from cache', () => {
    const params = {
      workloadUUID: 'uuid3',
      workloadName: 'name3',
      workloadNamespace: 'namespace3',
    };
    const responseData = [
      {
        workloadUUID: 'uuid3',
        clusterName: 'cname3',
        status: 'Healthy',
      },
    ];

    serviceCache.setDataItem(params, responseData);
    const removed = serviceCache.removeDataItem(params);
    expect(removed).toBe(true);
    expect(serviceCache.toMap().has('uuid3')).toBe(false);
  });

  it('should not remove non-existing data item from cache', () => {
    const params = {
      workloadUUID: 'nonExistingUUID',
      workloadName: 'name4',
      workloadNamespace: 'namespace4',
    };

    const removed = serviceCache.removeDataItem(params);
    expect(removed).toBe(false);
  });

  it('should iterate over all items in the cache', async () => {
    const firstParams = {
      workloadUUID: 'uuid5',
      workloadName: 'name5',
      workloadNamespace: 'namespace5',
    };

    const secondParams = {
      workloadUUID: 'uuid6',
      workloadName: 'name6',
      workloadNamespace: 'namespace6',
    };

    const items = [
      {
        requestInfo: firstParams,
        responseInfo: [
          {
            workloadUUID: 'uuid5',
            clusterName: 'cname5',
            status: 'Unhealthy',
          },
        ],
        lastUpdateRequest: Date.now(),
      },
      {
        requestInfo: secondParams,
        responseInfo: [
          {
            workloadUUID: 'uuid6',
            clusterName: 'cname6',
            status: 'Healthy',
          },
        ],
        lastUpdateRequest: Date.now(),
      },
    ];

    serviceCache.setDataItem(firstParams, items[0].responseInfo);
    serviceCache.setDataItem(secondParams, items[1].responseInfo);

    const callback = jest.fn();
    await serviceCache.forEach(callback);

    // Ensure the callback was called for each item
    expect(callback).toHaveBeenCalledTimes(2);
    expect(callback).toHaveBeenNthCalledWith(
      1,
      items[0].requestInfo,
      items[0].responseInfo,
    );
    expect(callback).toHaveBeenNthCalledWith(
      2,
      items[1].requestInfo,
      items[1].responseInfo,
    );
  });
});
