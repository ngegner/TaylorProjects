const { Model } = require('objection');
const Vehicle = require('./Vehicle');
const State = require('./State');

class Driver extends Model {
    static get tableName() {
        return 'driver';
    }
    static get relationMappings() {
        const User = require('./User');
        const Ride = require('./Ride');
        return {
            user: {
                relation: Model.BelongsToOneRelation,
                modelClass: User,
                join: {
                    from: 'driver.userID',
                    to: 'user.userID'
                }
            },
            licenseSt: {
                relation: Model.BelongsToOneRelation,
                modelClass: State,
                join: {
                    from: 'driver.licenseState',
                    to: 'state.abbreviation'
                }
            },
            vehicle: {
                relation: Model.ManyToManyRelation,
                modelClass: Vehicle,
                join: {
                    from: 'driver.id',
                    through: {
                        from: 'authorization.driverID',
                        to: 'authorization.vehicleID',
                    },
                    to: 'vehicle.id'
                }
            },
            ride: {
                relation: Model.ManyToManyRelation,
                modelClass: Ride,
                join: {
                    from: 'driver.id',
                    through: {
                        from: 'drivers.driverID',
                        to: 'drivers.rideID',
                    },
                    to: 'ride.id'
                }
            }
        };
    }
}

module.exports = Driver;