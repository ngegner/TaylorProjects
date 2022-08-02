const knex = require("knex")({
    client: "pg",
    connection: {
      host: "faraday.cse.taylor.edu",
      user: "jackson_miller",
      password: "xopijuti",
      database: "jackson_miller"
    },
  });
  
  console.log(knex.select().from('user'));