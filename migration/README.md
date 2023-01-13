# Wind-Comment Migration Tool

a convenient helper to automatically convert SQL to Cloudflare Workers KV and upload the data

## Usage

Fill in `config.js`.

- `cfAuthToken`: You need the `Account.Workers KV Storage` permission only when creating an API token.
- `urlPrefix`: You may need to edit [this line of code](./main.js#L11) according to the actual situation.
