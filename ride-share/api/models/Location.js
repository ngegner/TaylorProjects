const { Model } = require('objection');
const State = require('./State');

class Location extends Model {
    static get tableName() {
        return 'location';
    }
    static get relationMappings() {
        const Ride = require('./Ride');
        return {
            st: {
                relation: Model.BelongsToOneRelation,
                modelClass: State,
                join: {
                    from: 'location.state',
                    to: 'state.abbreviation'
                }
            },
            incomingRide: {
                relation: Model.HasManyRelation,
                modelClass: Ride,
                join: {
                    from: 'location.id',
                    to: 'ride.toLocationID'
                }
            },
            outgoingRide: {
                relation: Model.HasManyRelation,
                modelClass: Ride,
                join: {
                    from: 'location.id',
                    to: 'ride.fromLocationID'
                }
            },
        }
    }
}

module.exports = Location;