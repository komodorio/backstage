# komodor

Welcome to the Komodor backend plugin!

_This plugin was created through the Backstage CLI_

## Setup & Configuration

This plugin must be explicitly added to a Backstage app, along with it's peer front end plugin. The front end plugin should also be properly configured, as described in the README file of it.

It requires configuration in the Backstage `app-config.yaml` to connect to a Komodor agent. For local development, you might configure `app-config.local.yaml` instead.
If you run the frontend and the backend projects from different processes, only the configuration file of the backend should be configured.

Example:

```yaml
komodor:
  url: http://localhost:7008
  apiKey: '90890-dda2d-32acb-efad8'
```

## `url`

The url of the Komodor service.

## `apiKey`

The API key used for accessing the Komodor service.

## `cache` (optional)

- `shouldFetch`: Should data be fetched from the cache each client request, if
  already exists. Default is false.
- `shouldUpdate`: Should the cache be updated constantly. Default is false.

In addition, configuration of an entity's `catalog-info.yaml` helps identify which specific Komodor object(s) should be presented on a specific entity catalog page.
Specifically you might add the reference to this file to the `app.config.yaml` file,
by adding it to the `catalog.locations` field.

An example of such file can be found in `plugins/komodor-backend/examples/`.

For more information, see the [formal documentation about the Kubernetes feature in Backstage](https://backstage.io/docs/features/kubernetes/overview).

## Getting started

In order to run the backend only, you might run `yarn start-backend` in the project's
root directory. For testing without a Komodor service runnin, you might run
`plugins/komodor-backend/src/service/komodorAgentMock/komodorServiceMock.ts`.

You can also serve the plugin in isolation by running `yarn start` in the plugin directory.
This method of serving the plugin provides quicker iteration speed and a faster startup and hot reloads.
It is only meant for local development, and the setup for it can be found inside the [/dev](/dev) directory.
