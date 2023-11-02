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
import {
  createApiFactory,
  createPlugin,
  createRoutableExtension,
  discoveryApiRef,
  identityApiRef,
} from '@backstage/core-plugin-api';
import { komodorApiRef, KomodorClient } from './api';
import { rootRouteRef } from './routes';
import { Entity } from '@backstage/catalog-model';

export const KOMODOR_ID_ANNOTATION = 'komodor.io/komodor-entity-id';

export const komodorPlugin = createPlugin({
  id: 'komodor',
  apis: [
    createApiFactory({
      api: komodorApiRef,
      deps: { discoveryApi: discoveryApiRef, identityApi: identityApiRef },
      factory: ({ discoveryApi, identityApi }) =>
        new KomodorClient({ discoveryApi, identityApi }),
    }),
  ],
});

export const EntityKomodorContent = komodorPlugin.provide(
  createRoutableExtension({
    name: 'EntityKomodorContent',
    component: () =>
      import('./components/EntityKomodorWorkloadTableCard').then(
        m => m.EntityKomodorWorkloadTableCard,
      ),
    mountPoint: rootRouteRef,
  }),
);

export const isKomodorAvailable = (entity: Entity) =>
  Boolean(entity.metadata.annotations?.[KOMODOR_ID_ANNOTATION]);
