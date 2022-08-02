const { knex } = require("./init");

//const { default: knex } = require("knex");
const Vehicle = require("../models/Vehicle.js");

async function create() {
  const newVehicle = await Vehicle.query().insertGraph([
        {
            make: 'BMW',
            model: 'i8',
            color: 'black',
            vehicleType: [{
                id: 11,
                type: 'sedan'
            }],
            capacity: '4',
            mpg: 25.7,
            licenseSt: [{
                abbreviation: 'MI',
                name: 'Michigan'
            }],
            licensePlate: 'HOY109'
        }
  ])
  console.log("CREATE\n", newVehicle);
}

async function read(id) {
  const vehicle = await Vehicle.query().select().where('id', id);

  console.log('READ\n', vehicle);

}

async function update() {}

async function deleteTest(id) {
  const vehicle = await Vehicle.query().del().where('id', 10);

  console.log('DELETE\n', vehicle);
}

async function main() {
  await create();
  await read(7);
  //await update();
  //await deleteTest();
  
   knex.destroy();
}

process.on("unhandledRejection", (err) => {
  console.error(err);
  process.exit(1);
});

main();
