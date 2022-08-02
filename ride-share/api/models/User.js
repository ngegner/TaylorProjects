const { Model } = require("objection");
const Ride = require("./Ride");
const Driver = require("./Driver");

class User extends Model {
  static get tableName() {
    return "user";
  }

  static get relationMappings() {
    return {
      ride: {
        relation: Model.ManyToManyRelation,
        modelClass: Ride,
        join: {
          from: "user.id",
          through: {
            from: "passenger.userID",
            to: "passenger.rideID",
          },
          to: "ride.id",
        },
      },
      driver: {
        relation: Model.HasManyRelation,
        modelClass: Driver,
        join: {
          from: "user.id",
          to: "driver.userID",
        },
      },
    };
  }
}

module.exports = User;
