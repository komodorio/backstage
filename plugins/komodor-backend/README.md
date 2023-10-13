# komodor

Welcome to the komodor backend plugin!

_This plugin was created through the Backstage CLI_

## Setup & Configuration

This plugin must be explicitly added to a Backstage app, along with it's peer front end plugin.

It requires configuration in the Backstage `app-config.yaml` to connect to a Komodor API control plane.

In addition, configuration of an entity's `catalog-info.yaml` helps identify which specific Komodor object(s) should be presented on a specific entity catalog page.

For more information, see the [formal documentation about the Kubernetes feature in Backstage](https://backstage.io/docs/features/kubernetes/overview).

## Getting started

Your plugin has been added to the example app in this repository, meaning you'll be able to access it by running `yarn
start` in the root directory, and then navigating to [/komodor](http://localhost:3000/komodor).

You can also serve the plugin in isolation by running `yarn start` in the plugin directory.
This method of serving the plugin provides quicker iteration speed and a faster startup and hot reloads.
It is only meant for local development, and the setup for it can be found inside the [/dev](/dev) directory.
