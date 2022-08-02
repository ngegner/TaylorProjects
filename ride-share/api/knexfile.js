// Update with your config settings.

module.exports = {
  development: {
    client: "pg",
    connection: {
      host: "faraday.cse.taylor.edu",
      user: "jackson_miller",
      password: "xopijuti",
      database: "jackson_miller",
    },
  },

  staging: {
    client: "postgresql",
    connection: {
      database: "my_db",
      user: "username",
      password: "password",
    },
    pool: {
      min: 2,
      max: 10,
    },
    migrations: {
      tableName: "knex_migrations",
    },
  },

  production: {
    client: "postgresql",
    connection: {
      database: "my_db",
      user: "username",
      password: "password",
    },
    pool: {
      min: 2,
      max: 10,
    },
    migrations: {
      tableName: "knex_migrations",
    },
  },
};
