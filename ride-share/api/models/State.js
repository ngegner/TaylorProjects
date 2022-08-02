const { Model } = require('objection');


class State extends Model {
    static get tableName() {
        return 'state';
    }
}

module.exports = State;