// Knex
const knex = require("knex")({
    client: "pg",
    connection: {
        host: "faraday.cse.taylor.edu",
        user: "jackson_miller",
        password: "xopijuti",
        database: "jackson_miller",
    },
});

// Objection
const {Model} = require("objection");
Model.knex(knex);

// Models
const User = require("./models/User");
const Driver = require("./models/Driver");
const Location = require("./models/Location");
const Ride = require("./models/Ride");
const State = require("./models/State");
const Vehicle = require("./models/Vehicle");
const VehicleType = require("./models/VehicleType");

// Hapi
const Joi = require("@hapi/joi"); // Input validation
const Hapi = require("@hapi/hapi"); // Server
const {query, JoinEagerAlgorithm} = require("../api/models/Ride");

const server = Hapi.server({
    host: "localhost",
    port: 3000,
    routes: {
        cors: true,
    },
});

async function init() {
    // Show routes at startup.
    await server.register(require("blipp"));

    // Output logging information.
    await server.register({
        plugin: require("hapi-pino"),
        options: {
            prettyPrint: true,
        },
    });

    //Configure routes
    server.route([
        {
            method: "GET",
            path: "/",
            handler: async (request, h) => {
                return await User.query().select();
            },
        },

        /**
         * Search for ride by type and keyword
         * @param string searchKey
         * @param string type
         * @returns Array of rides or error reporting none found
         */
        {
            method: 'GET',
            path: '/rides/{searchKey}/{type}',
            config: {
                description: "Search for rides",
                validate: {
                    params: Joi.object({
                        type: Joi.string().required(),
                        searchKey: Joi.string().required(),
                    }),
                },
            },
            handler: async (request, h) => {
                const type = request.params.type;
                const searchKey = request.params.searchKey;
                let returnRides = [];

                const rides = await Ride.query().withGraphFetched('toLocation').modifyGraph('toLocation', builder => {
                    builder.where(type, 'like', '%' + searchKey + '%');
                });
                rides.forEach(ride => {
                    if (ride.toLocation) {
                        returnRides.push(ride);
                    }
                });
                if (!returnRides.length) {
                    return {
                        ok: false,
                        msge: `Nothing for ${type} and ${searchKey}`
                    }
                } else {
                    return {
                        ok: true,
                        msge: returnRides
                    }
                }
            }
        },

        /**
         * Add a user to a ride
         * @param int rideId
         * @param int userId
         * @returns string stating success/failure
         */
        {
            method: 'PUT',
            path: '/passengers/{rideID}/{userID}',
            config: {
                description: 'User can join a ride',
                validate: {
                    params: Joi.object({
                        userID: Joi.number().integer().min(1),
                        rideID: Joi.number().integer().min(1)
                    })
                }
            },
            handler: async (request, h) => {
                const userID = request.params.userID;
                const rideID = request.params.rideID;
                const user = await User.query().withGraphFetched('ride').where('id', userID);
                const ride = await Ride.query().withGraphFetched('vehicle').where('id', rideID);
                const userRide = await knex.select().from('passenger').where('userID', userID).andWhere('rideID', rideID);

                if (user.length !== 1) {
                    return {
                        ok: false,
                        msge: `User with id ${userID} does not exist`
                    }
                } else if (ride.length !== 1) {
                    return {
                        ok: false,
                        msge: `Ride with id ${rideID} does not exist`
                    }
                } else if (userRide.length >= 1) {
                    return {
                        ok: false,
                        msge: `User with id ${userID} is already signed up for ride ${rideID}`
                    }
                } else if (ride[0].passengerCount >= ride[0].vehicle.capacity) {
                    return {
                        ok: false,
                        msge: `Ride with id ${rideID} is full`
                    }
                } else {
                    await Ride.relatedQuery('user').for(rideID).relate(userID);
                    let passCountArr = await Ride.query().select().where('id', rideID);
                    let passCount = passCountArr[0].passengerCount;
                    ++passCount;
                    await Ride.query().patch({passengerCount: passCount}).where('id', rideID);
                    return {
                        ok: true,
                        msge: `User ${userID} has successfuly joined ride ${rideID}`,
                    }
                }
            },
        },

        /**
         * Sign up to drive
         * @param int rideId
         * @param int userId
         * @returns string stating success/failure
         */
        {
            method: 'PUT',
            path: '/drivers/{rideID}/{userID}',
            config: {
                description: 'User can sign up to drive for ride',
                validate: {
                    params: Joi.object({
                        userID: Joi.number().integer().min(1),
                        rideID: Joi.number().integer().min(1)
                    })
                }
            },
            handler: async (request, h) => {
                const userID = request.params.userID;
                const rideID = request.params.rideID;

                let driverID = await Driver.query().select('id').where('userID', userID);
                if (driverID == "") {
                    return {
                        ok: false,
                        msge: `You are not signed up to drive`
                    }
                }

                driverID = driverID[0].id;
                let vehicleID = await Ride.query().select('vehicleID').where('id', rideID);
                vehicleID = vehicleID[0].vehicleID;

                const isDriver = await knex.select().from('drivers').where('driverID', driverID).andWhere('rideID', rideID);
                const authorized = await knex.select().from('authorization').where('driverID', driverID).andWhere('vehicleID', vehicleID);

                if (isDriver.length >= 1) {
                    return {
                        ok: false,
                        msge: `User ${userID} is already signed up to drive on ride ${rideID}`
                    }
                } else if (authorized.length == 0) {
                    return {
                        ok: false,
                        msge: `User ${userID} is not authorized to drive on ride ${rideID}`
                    }
                } else {
                    await Ride.relatedQuery('driver').for(rideID).relate(driverID);
                    return {
                        ok: true,
                        msge: `User ${userID} is now driving for ride ${rideID}`
                    }
                }
            },
        },

        /**
         * Display rides for a given user
         * @param int userId
         * @return Array[Object] user's rides
         */
        {
            method: "GET",
            path: '/rides/{userID}',
            config: {
                description: 'Display user rides',
                validate: {
                    params: Joi.object({
                        userID: Joi.number().integer().min(1),
                    })
                }
            },
            handler: async (request, h) => {
                const userID = request.params.userID;
                const returnRides = await Ride.getRides(userID);

                if (returnRides.length == 0) {
                    return {
                        ok: false,
                        msge: `Nothing for ${userID}`
                    }
                } else {
                    return {
                        ok: true,
                        msge: returnRides
                    }
                }
            }
        },

        /**
         * Leave a ride
         * @param int rideId
         * @param int userId
         * @return string stating success or failure
         */
        {
            method: "DELETE",
            path: '/rides/{rideID}/{userID}',
            config: {
                description: 'Leave a ride',
                validate: {
                    params: Joi.object({
                        rideID: Joi.number().integer().min(1),
                        userID: Joi.number().integer().min(1),
                    })
                }
            },
            handler: async (request, h) => {
                const rideID = request.params.rideID;
                const ride = await Ride.relatedQuery('user').for(rideID).unrelate().where('id', request.params.userID).returning('*');
                // Decrement passengerCount
                let passCountArr = await Ride.query().select().where('id', rideID);
                let passCount = passCountArr[0].passengerCount;
                --passCount;
                await Ride.query().patch({passengerCount: passCount}).where('id', rideID);

                const returnRides = await Ride.getRides(request.params.userID);

                if (ride == 1) {
                    return {
                        ok: true,
                        msge: `Successfully left ride ${rideID}`,
                        newList: returnRides
                    }
                } else {
                    return {
                        ok: false,
                        msge: `Couldn't leave ride ${rideID}`
                    }
                }
            }
        },

        /**
         * Display user driving plans
         * @param int userId
         * @return Array[Object]
         */
        {
            method: "GET",
            path: '/drives/{userID}',
            config: {
                description: 'Display rides user will drive on',
                validate: {
                    params: Joi.object({
                        userID: Joi.number().integer().min(1),
                    })
                }
            },
            handler: async (request, h) => {
                const userID = request.params.userID;

                let driverID = await Driver.query().select('id').where('userID', userID);
                if (driverID == "") {
                    return {
                        ok: false,
                        msge: `You are not signed up to drive`
                    }
                }

                driverID = driverID[0].id;
                const returnDrives = await Ride.getDrives(driverID);

                if (returnDrives.length == 0) {
                    return {
                        ok: false,
                        msge: `Nothing for user ${userID}`
                    }
                } else {
                    return {
                        ok: true,
                        msge: returnDrives
                    }
                }
                ;
            }
        },

        {
            method: "DELETE",
            path: '/drives/{rideID}/{userID}',
            config: {
                description: 'Leave a ride you signed up to drive on',
                validate: {
                    params: Joi.object({
                        rideID: Joi.number().integer().min(1),
                        userID: Joi.number().integer().min(1)
                    })
                }
            },
            handler: async (request, h) => {
                let driverID = await Driver.query().select('id').where('userID', request.params.userID);
                driverID = driverID[0].id;
                const rideID = request.params.rideID;

                const ride = await Ride.relatedQuery('driver').for(rideID).unrelate().where('id', driverID).returning('*');
                const returnDrives = await Ride.getDrives(driverID);

                if (ride == 1) {
                    return {
                        ok: true,
                        msge: `Successfully left ride ${rideID}`,
                        newList: returnDrives
                    }
                } else {
                    return {
                        ok: false,
                        msge: `Couldn't leave ride ${rideID}`
                    }
                }
            }
        },

        {
            method: "GET",
            path: '/vehicles',
            config: {
                description: 'Display vehicles for admin'
            },
            handler: async (request, h) => {
                return {
                    ok: true,
                    msge: await Vehicle.query().withGraphFetched('vehicleType')
                }
            }
        },

        {
            method: "PUT",
            path: '/vehicles/{id}',
            config: {
                description: 'Modify a vehicle',
                validate: {
                    params: Joi.object({
                        id: Joi.number().integer().min(1)
                    }),
                    payload: Joi.object({
                        make: Joi.string(),
                        model: Joi.string(),
                        color: Joi.string(),
                        type: Joi.number().integer().min(1),
                        capacity: Joi.number().integer().min(1),
                        mpg: Joi.number().min(1),
                        licenseState: Joi.string(),
                        licensePlate: Joi.string(),
                    })
                }
            },
            handler: async (request, h) => {
                /*if (request.payload.vehicleTypeID) {
                  const vehicleType = await VehicleType.query().select().where('id', request.payload.vehicleTypeID);
                  if (vehicleType.length == 0) {
                    return {
                      ok: false,
                      msge: `Vehicle type ${request.payload.vehicleTypeID} doesn't exist`
                    }
                  }
                }
                if (request.payload.licenseState) {
                  const state = await State.query().select().where('abbreviation', request.payload.licenseState);
                  if (state.length == 0) {
                    return {
                      ok: false,
                      msge: `Can't find state ${request.payload.licenseState}`
                    }
                  }
                }*/

                const modVehicle = await Vehicle.query().patch(request.payload).where('id', request.params.id).returning('*');
                if (modVehicle.length == 1) {
                    return {
                        ok: true,
                        msge: `Succesfully modified vehicle ${request.params.id}`,
                        newList: await Vehicle.query().select()
                    }
                } else {
                    return {
                        ok: false,
                        msge: `Something went wrong modifying vehicle ${request.params.id}`
                    }
                }

            }
        },

        {
            method: "POST",
            path: '/vehicles',
            config: {
                description: 'Create a vehicle',
                validate: {
                    payload: Joi.object({
                        make: Joi.string().required(),
                        model: Joi.string().required(),
                        color: Joi.string().required(),
                        vehicleTypeID: Joi.number().integer().min(1).required(),
                        capacity: Joi.number().integer().min(1).required(),
                        mpg: Joi.number().min(1).required(),
                        licenseState: Joi.string().required(),
                        licensePlate: Joi.string().required(),
                    })
                }
            },
            handler: async (request, h) => {
                const newVehicle = await Vehicle.query().insert(request.payload).returning('*');
                if (newVehicle) {
                    return {
                        ok: true,
                        msge: `Succesfully created new vehicle with id ${newVehicle.id}`,
                        newList: await Vehicle.query().select()
                    }
                } else {
                    return {
                        ok: false,
                        msge: `Something went wrong creating new vehicle`
                    }
                }
            }
        },

        {
            method: "DELETE",
            path: '/vehicles/{id}',
            config: {
                description: 'Delete a vehicle',
                validate: {
                    params: Joi.object({
                        id: Joi.number().integer().min(1)
                    })
                }
            },
            handler: async (request, h) => {
                const vehicleID = request.params.id;
                // Unrelate from ride and driver
                const ride = await Vehicle.relatedQuery('ride').for(vehicleID).unrelate().where('vehicleID', vehicleID).returning("*");
                const driver = await Vehicle.relatedQuery('driver').for(vehicleID).unrelate().returning("*");

                // Delete
                const delVehicle = await Vehicle.query().deleteById(vehicleID);

                if (delVehicle) {
                    return {
                        ok: true,
                        msge: `Succesfully deleted vehicle with id ${vehicleID}`,
                        //newList: await Vehicle.query().select()
                    }
                } else {
                    return {
                        ok: false,
                        msge: `Something went wrong deleting vehicle ${vehicleID}`
                    }
                }
            }
        },


        {
            method: "POST",
            path: '/drivers',
            config: {
                description: 'Sign up to drive',
                validate: {
                    payload: Joi.object({
                        userID: Joi.number().integer().min(1),
                        licenseNumber: Joi.string().required(),
                        licenseState: Joi.string().required(),
                    })
                }
            },
            handler: async (request, h) => {
                const userID = request.payload.userID;
                const driver = await Driver.query().select().where('userID', userID);
                if (driver.length == 0) {
                    const newDriver = await Driver.query().insert(request.payload).returning("*");
                    return {
                        ok: true,
                        msge: `Succesfully registered to drive with driver id ${newDriver.id}`,
                    }
                } else {
                    return {
                        ok: false,
                        msge: `User ${userID} is already registered to drive!`
                    }
                }

            }
        }


    ]);

    //Start the server
    await server.start();
}

// Go!
init();
