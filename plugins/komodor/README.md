# komodor Plugin

<img src="./src/assets/screenshot-1.png">

## Setup

1. Run:

```bash
# From your Backstage root directory
yarn --cwd packages/app add @backstage/plugin-komodor
yarn --cwd packages/backend add @backstage/plugin-komodor-backend
```

2. Add the plugin backend:

In a new file named `komodor.ts` under `backend/src/plugins`:

```js
import { createRouter } from '@backstage/plugin-komodor-backend';
import { Router } from 'express';
import { PluginEnvironment } from '../types';

export default async function createPlugin(
  env: PluginEnvironment,
): Promise<Router> {
  return await createRouter({
    logger: env.logger,
    config: env.config,
  });
}
```

And then add to `packages/backend/src/index.ts`:

```js
// In packages/backend/src/index.ts
import komodor from './plugins/komodor';
// ...
async function main() {
  // ...
  const komodorEnv = useHotMemoize(module, () => createEnv('komodor'));
  // ...
  apiRouter.use('/komodor', await komodor(komodorEnv));
```

3. Add the plugin as a tab to your service entities:

```jsx
// In packages/app/src/components/catalog/EntityPage.tsx
import { EntityKomodorContent } from '@backstage/plugin-komodor';

const serviceEntityPage = (
  <EntityLayout>
    {/* other tabs... */}
    <EntityLayout.Route path="/komodor" title="Komodor">
      <EntityKomodorContent />
    </EntityLayout.Route>
```

4. Add configs for the backend in your `app-config.yaml`. The full instructions
   can be found in the README file of the backend project.

## Run

In order to run the full system, run `yarn dev` from the root directory.
In order to run the front end only, run `yarn start`.
