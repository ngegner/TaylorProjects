const { Model } = require("objection");
const User = require('../models/User.js');

exports.seed = function (knex) {
    Model.knex(knex);
    return knex('drivers').del()
        .then(() => knex('passenger').del())
        .then(() => Promise.all([
            knex('ride').del(),
            knex('authorization').del()
        ]))
        .then(() => Promise.all([
            knex('location').del(),
            knex('driver').del(),
            knex('vehicle').del()
        ]))
        .then(() => Promise.all([
            knex('user').del(),
            knex('state').del(),
            knex('vehicleType').del()
        ]))
        .then(() => User.query().insertGraph([
            {
                '#id': 'Joe',
                firstName: 'Joe',
                lastName: 'Buck',
                email: 'joe@gmail.com',
                password: '1592',
                phone: '333-444-0000',
                isAdmin: true,
                ride: [{
                    '#id': '10',
                    date: '2021-03-13',
                    time: '13:12:00',
                    distance: 80.0,
                    fuelPrice: 2.90,
                    fee: 25,
                    vehicle: [{
                        '#id': 'Buick',
                        make: 'Buick',
                        model: 'Lacrosse',
                        color: 'red',
                        vehicleType: [{
                            type: 'sedan'
                        }],
                        capacity: 4,
                        mpg: 18.9,
                        licenseSt: [{
                            '#id': 'IN',
                            abbreviation: 'IN',
                            name: 'Indiana'
                        }],
                        licensePlate: 'HH5070'
                    }],
                    fromLocation: [{
                        name: 'Walgreens',
                        address: '1 Main St',
                        city: 'Upland',
                        st: [{ '#ref': 'IN' }],
                        zipCode: '46989'
                    }],
                    toLocation: [{
                        name: 'The Bullpen',
                        address: '5 Main St',
                        city: 'Zionsville',
                        st: [{ '#ref': 'IN' }],
                        zipCode: '46077'
                    }]

                }]
            },
            {
                '#id': 'Tim',
                firstName: 'Tim',
                lastName: 'Bucktwo',
                email: 'tim@gmail.com',
                password: '1234567',
                phone: '555-555-5555',
                isAdmin: true,
                ride: [{
                        '#id': "Bob's Ride",
                        date: '2021-04-10', 
                        time: '15:30:00', 
                        distance: 70.3, 
                        fuelPrice: 2.87, 
                        fee: 20,
                        vehicle: [{
                            '#id': 'Ford',
                            make: 'Ford',
                            model: 'Explorer',
                            color: 'maroon',
                            capacity: 6,
                            mpg: 26.5,
                            licensePlate: '4W43IO',
                            vehicleType: [{
                                type: 'SUV'
                            }],
                            licenseSt: [{
                                '#ref': 'IN'
                            }],
                        }],
                        fromLocation: [{
                            name: 'Wengatz Hall',
                            address: '45 Reade ave',
                            city: 'Upland',
                            st: [{ '#ref': 'IN' }],
                            zipCode: '46989'
                        }],
                        toLocation: [{
                            name: 'Wheaton University',
                            address: '284 Wheaton ave',
                            city: 'Wheaton',
                            st: [{
                                '#id': 'IL',
                                abbreviation: 'IL',
                                name: 'Illinois',
                            }],
                            zipCode: '60187'
                        }]
                    }]
            },
            {
                '#id': 'Susie',
                firstName: 'Susie',
                lastName: 'Jacobs',
                email: 'sue@yahoo.com',
                password: '343463134',
                phone: '555-234-1264',
                isAdmin: false,
                driver: [{
                    licenseNumber: '123456',
                    licenseSt: [{ 
                        '#id': 'OH',
                        abbreviation: 'OH',
                        name: 'Ohio'
                    }],
                    vehicle: [{
                        '#ref': 'Buick'
                    }],
                    ride: [{
                        '#ref': '10'
                    }]
                }]
            },
            {
                firstName: 'Bob',
                lastName: 'Allen',
                email: 'bob@bob.edu',
                password: '4928598209',
                phone: '555-589-0934',
                isAdmin: true,
                driver: [{
                    licenseNumber: '5496-483-4033',
                    licenseSt: [{
                        '#ref': 'IL'
                    }],
                    vehicle: [{
                        '#ref': 'Ford'
                    }],
                    ride: [{
                        '#ref': "Bob's Ride"
                    }]
                }]
            }
        ],
            { allowRefs: true }
        )
        )
};

