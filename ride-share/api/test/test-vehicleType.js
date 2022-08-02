const { knex } = require("./init");

const VehicleType = require("../models/VehicleType.js");

async function create() {
    const newVehicleType = await VehicleType.query().insert(
        {
            'type': 'SUV',
        }
    );
    console.log(`CREATE\n ${newVehicleType}`);
}

async function read(id) {
    const vehicleType = await VehicleType.query().select().where('id', id);
    
    console.log(`READ\n ${vehicleType}`);
}

async function update() {}

async function deleteTest(id) {
    const vehicleType = await vehicleType.query().del().where('id', id);

    console.log(`DELETE\n ${vehicleType}`);
}

async function main() {
    await create();
    await read(8);
    //await update();
    //await deleteTest();

    knex.destroy();
}

process.on("unhandledRejection", (err) => {
    console.error(err);
    process.exit(1);
  });
  
  main();