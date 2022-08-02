/*const knex = require('knex');

objection = require('objection');
const Model = objection.Model;
Model.knex(knex);
*/
exports.up = function(knex){
    return knex.schema
        .createTable('user', table => {
            table.increments();
            table.string('firstName');
            table.string('lastName');
            table.string('email');
            table.string('password');
            table.string('phone');
            table.boolean('isAdmin');            
        })
        .then(() => Promise.all([
            knex.schema.createTable('vehicleType', table => {
                table.increments();
                table.string('type');
            }),
            knex.schema.createTable('state', table => {
                table.string('abbreviation').primary();
                table.string('name');
                table.integer('id');
            })
        ]))
        .then(() => Promise.all([
            knex.schema.createTable('location', table => {
                table.increments();
                table.string('name');
                table.string('address');
                table.string('city');
                table.string('state').references('state.abbreviation');
                table.string('zipCode');
            }), 
            knex.schema.createTable('driver', table => {
                table.increments();
                table.integer('userID').references('user.id');
                table.string('licenseNumber');
                table.string('licenseState').references('state.abbreviation');
            }),
            knex.schema.createTable('vehicle', table => {
                table.increments();
                table.string('make');
                table.string('model');
                table.string('color');
                table.integer('vehicleTypeID').references('vehicleType.id');
                table.integer('capacity');
                table.float('mpg');
                table.string('licenseState').references('state.abbreviation');
                table.string('licensePlate');
            }),
        ]))
        .then(() => Promise.all([
            knex.schema.createTable('authorization', table => {
                table.integer('driverID').references('driver.id');
                table.integer('vehicleID').references('vehicle.id');
            }),
            knex.schema.createTable('ride', table => {
                table.increments();
                table.date('date');
                table.time('time');
                table.float('distance');
                table.float('fuelPrice');
                table.float('fee');
                table.integer('vehicleID').references('vehicle.id');
                table.integer('fromLocationID').references('location.id');
                table.integer('toLocationID').references('location.id');                
            })
        ]))
        .then(() => Promise.all([
            knex.schema.createTable('passenger', table => {
                table.integer('userID').references('user.id');
                table.integer('rideID').references('ride.id');
            }),
            knex.schema.createTable('drivers', table => {
                table.integer('driverID').references('driver.id');
                table.integer('rideID').references('ride.id');
            })
        ]))
        .catch(err => console.log(`ERROR: ${err}`));
}

exports.down = function(knex) {
    return Promise.all([
        knex.schema.dropTable('drivers'),
        knex.schema.dropTable('passenger')
    ]).then(() => Promise.all([
        knex.schema.dropTable('ride'),
        knex.schema.dropTable('authorization')
    ])).then(() => Promise.all([
        knex.schema.dropTable('vehicle'),
        knex.schema.dropTable('driver'),
        knex.schema.dropTable('location'),
    ])).then(() => Promise.all([
        knex.schema.dropTable('state'),
        knex.schema.dropTable('vehicleType'),
        knex.schema.dropTable('user')
    ])).catch(error => console.log(`ERROR: ${error}`));
};
