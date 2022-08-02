const { knex } = require("./init");

//const { default: knex } = require("knex");
const Ride = require("../models/Ride.js");
const Driver = require("../models/Driver.js");

async function create() {
  const newRide = await Ride.query().insert(
    {
      date: '',
      time: '',
      distance: 80.0,
      fuelPrice: 2.90,
      fee: 25,
      vehicle: [{

      }],
      fromLocation: [{}],
      toLocation: [{}]
    }
  )
  console.log("CREATE\n", newRide);
}

async function read(id) {
  const ride = await Ride.query().select().where('id', id);

  console.log('READ\n', ride);

}

async function update() { }

async function deleteTest(id) {
  const ride = await Ride.query().del().where('id', 10);

  console.log('DELETE\n', ride);
}

async function main() {
  //await create();
  //await read(5);
  //await update();
  //await deleteTest();


  let driverID = await Driver.query().select('id').where('userID', 10);
  if (driverID == "") {
    console.log( {
      ok: false,
      msge: `You are not signed up to drive`
    })
  }

  driverID = driverID[0].id;
  const vehicleID = await Ride.query().select('vehicleID').where('id', 6);
  console.log(vehicleID);

  const isDriver = await knex.select().from('drivers').where('driverID', driverID).andWhere('rideID', 6);
  const authorized = await knex.select().from('authorization').where('driverID', driverID).andWhere('vehicleID', vehicleID);

  if (isDriver.length >= 1) {
    console.log({
      ok: false,
      msge: `User ${10} is already signed up to drive on ride ${6}`
    })
  } else if (authorized.length == 0) {
    console.log( {
      ok: false,
      msge: `User ${10} is not authorized to drive on ride ${6}`
    })
  } else {
    await Ride.relatedQuery('driver').for(6).relate(driverID);
    console.log({
      ok: true,
      msge: `User ${10} is now driving for ride ${6}`
    })
  }


  knex.destroy();
}

process.on("unhandledRejection", (err) => {
  console.error(err);
  process.exit(1);
});

main();
