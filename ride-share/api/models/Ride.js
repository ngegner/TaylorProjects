const { Model } = require("objection");
const Vehicle = require("./Vehicle");
const Driver = require('./Driver');
const Location = require('./Location');


class Ride extends Model {
    static get tableName() {
        return 'ride';
    }

    static get relationMappings() {
        const User = require("./User");
        return {
            vehicle: {
                relation: Model.BelongsToOneRelation,
                modelClass: Vehicle,
                join: {
                    from: 'ride.vehicleID',
                    to: 'vehicle.id'
                }
            },
            //Do we use two separate relations???
            fromLocation: {
                relation: Model.BelongsToOneRelation,
                modelClass: Location,
                join: {
                    from: 'ride.fromLocationID',
                    to: 'location.id'
                }
            },
            toLocation: {
                relation: Model.BelongsToOneRelation,
                modelClass: Location,
                join: {
                    from: 'ride.toLocationID',
                    to: 'location.id'
                }
            },
            user: {
                relation: Model.ManyToManyRelation,
                modelClass: User,
                join: {
                    from: 'ride.id',
                    through: {
                        from: 'passenger.rideID',
                        to: 'passenger.userID',
                    },
                    to: 'user.id'
                }
            },
            driver: {
                relation: Model.ManyToManyRelation,
                modelClass: Driver,
                join: {
                    from: 'ride.id',
                    through: {
                        from: 'drivers.rideID',
                        to: 'drivers.driverID',
                    },
                    to: 'driver.id'
                }
            },
        }
    }

    static async getRides(userID) {
        let rideIDs = [];
        let returnRides = [];

        const rides = await Ride.query().withGraphFetched('user').modifyGraph('user', builder => {
            builder.where('id', userID);
        });

        rides.forEach(ride => {
            if (ride.user.length === 1) {
                rideIDs.push(ride.id);
            }
        });

        for (let i = 0; i < rideIDs.length; i++) {
            const location = await Ride.query().where('id', rideIDs[i]).withGraphFetched('toLocation');
            returnRides.push(location[0]);
        }

        return returnRides;
    }

    static async getDrives(driverID) {
        let rideIDs = [];
        let returnDrives = [];

        const rides = await Ride.query().withGraphFetched('driver').modifyGraph('driver', builder => {
          builder.where('id', driverID);
        });

        rides.forEach(ride => {
          if (ride.driver.length === 1) {
            rideIDs.push(ride.id);
          }
        });

        for (let i = 0; i < rideIDs.length; i++) {
          const location = await Ride.query().where('id', rideIDs[i]).withGraphFetched('toLocation');
          returnDrives.push(location[0]);
        }
        
        return returnDrives;
    }
}

module.exports = Ride;