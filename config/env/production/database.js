const parse = require("pg-connection-string").parse;

// https://forum.strapi.io/t/getting-strapi-working-on-digitalocean-app-plattform/13244/5

const { host, port, database, user, password } = parse(
  process.env.DATABASE_URL
);

module.exports = ({ env }) => ({
  connection: {
    client: 'postgres',
    connection: {
      host,
      port,
      database,
      user,
      password,
      schema: env('DATABASE_SCHEMA', 'public'),
      ssl: {
        ca: env('DATABASE_CA'),
        rejectUnauthorized: env.bool('DATABASE_SSL_SELF', false),
      },
    },
    debug: false,
  }
});
