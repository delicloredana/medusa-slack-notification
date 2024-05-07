# Slack notification plugin

## Overview

This plugin enables sending notifications to a Slack channel when triggered by events.

## Features

Upon installing this plugin, Slack notifications will be triggered for specific events related to orders, swaps, and claims. Templates for these events are already predefined and can be found in the `/dist/templates` directory.

## Customizing Events and Templates

While predefined events and templates are provided, you have the flexibility to customize them to suit your needs. To do this, simply:

1. Create a `templates` folder within your project's `src` directory.
2. Create a file named after the specific category of events within the `templates` folder.
3. Within this file, define an array of events that will trigger the application (`EVENTS`), along with two essential functions:
   - One for fetching data (`prepareTemplateData`) - This function should return the data utilized in the templateData function.
   - Another for forming the template (`export default function templateData`) - This function should return an object with the message data and the id.

For a clear example, refer to the plugin in `/dist/templates` folder.
[Slack message examples](https://api.slack.com/block-kit/building)

## Installation

### Prerequisites

- [Medusa Backend](https://docs.medusajs.com/development/backend/install)
- [Slack account](https://slack.com)
- [Redis](https://docs.medusajs.com/development/backend/prepare-environment#redis)

## How To Install

### Medusa Plugin

1. In the root of your Medusa backend, run the following command to install the `medusa-plugin-slack-notification` plugin:

```bash
npm i medusa-plugin-slack-notification
medusa migrations run
```

2. Set the following environment variable in `.env` :

```
SLACK_API=<Bot_User_OAuth_token_in_your_slack_app>
CHANNEL=<CHANNEL_ID>
BACKEND_URL=<YOUR_BACKEND_URL>
```

3. Add the plugin to your `medusa-config.js` file at the end of the `plugins` array:

```js
module.exports = {
  // ...
  plugins: [
    // ...
    {
      resolve: "medusa-plugin-slack-notification",
      options: {
        enableUI: true,
        slack_api: process.env.SLACK_API,
        backend_url: process.env.BACKEND_URL,
        channel: process.env.CHANNEL,
      },
    },
  ],
  // ...
};
```

#### Running Locally

Follow these step-by-step instructions to run the project locally:

1. Fulfill everything mentioned in the prerequisites above
2. `git clone https://github.com/Agilo/medusa-plugin-slack-notification` - clone the repo
3. `cd medusa-plugin-slack-notification` - position into the project directory
4. `cp ./medusa/.env.example ./medusa/.env` - set up Medusa environment variables/docker
5. `docker compose up` - if using docker
6. Open new terminal tab
7. `npm i && npm run setup` - install dependencies
8. `cd medusa && medusa migrations run && npm run seed && cd ..` - run the migrations and seed the database
9. `npm run start` - build the packages and start the Medusa dev server and plugin watcher

Medusa Admin dashboard is now available at http://localhost:9000/app.

Default credentials for Medusa Admin are:

```
admin@medusa-test.com
supersecret
```

## License

This project is licensed under the [MIT License](./LICENSE).

## Credits

Medusa review plugin is developed and maintained by [AGILO](https://agilo.co/).
