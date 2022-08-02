const { Model } = require('objection');
const VehicleType = require('./VehicleType');
const State = require('./State');


class Vehicle extends Model {
    static get tableName() {
        return 'vehicle';
    }
    static get relationMappings() {
        const Driver = require('./Driver');
        const Ride = require("./Ride");
        return {
            vehicleType: {
                relation: Model.BelongsToOneRelation,
                modelClass: VehicleType,
                join: {
                    from: 'vehicle.vehicleTypeID',
                    to: 'vehicleType.id'
                }
            },
            licenseSt: {
                relation: Model.BelongsToOneRelation,
                modelClass: State,
                join: {
                    from: 'vehicle.licenseState',
                    to: 'state.abbreviation'
                }
            },
            driver: {
                relation: Model.ManyToManyRelation,
                modelClass: Driver,
                join: {
                    from: 'vehicle.id',
                    through: {
                        from: 'authorization.vehicleID',
                        to: 'authorization.driverID'
                    },
                    to: 'driver.id'
                }
            },
            ride: {
                relation: Model.HasManyRelation,
                modelClass: Ride,
                join: {
                    from: 'vehicle.id',
                    to: 'ride.vehicleID'
                }
            }
        }
    }
}

module.exports = Vehicle;