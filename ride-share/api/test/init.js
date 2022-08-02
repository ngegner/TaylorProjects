const knexConfig = require("../knexfile.js");
const knex = require("knex")(knexConfig.development);
const { Model } = require("objection");
Model.knex(knex);

// Import these if required; otherwise, just include this
// file in order to initialize Knex and Objection.
module.exports = { knex, Model };
