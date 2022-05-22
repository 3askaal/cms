const parse = require("pg-connection-string").parse;

const { host, port, database, user, password } = parse(
  process.env.DATABASE_URL
);

module.exports = ({ env }) => {
  return {
    connection: {
      client: 'postgres',
      connection: {
        host,
        port,
        database,
        user,
        password,
        schema: env('DATABASE_SCHEMA', 'public'), // Not required
        ssl: {
          ca: env('DATABASE_CA')
        },
      },
      debug: false,
    },
  }
};
