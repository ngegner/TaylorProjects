const { Model } = require('objection');

class VehicleType extends Model {
    static get tableName() {
        return 'vehicleType';
    }
}

module.exports = VehicleType;