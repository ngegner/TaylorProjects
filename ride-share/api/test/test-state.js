const { knex } = require("./init");

const State = require("../models/State.js");

async function create() {
    const newState = await State.query().insert(
        {
            'abbreviation': 'IN',
            'name': 'Indiana',
            'id': 59,
        }
    );

    console.log(`CREATE\n ${newState}`);
}

async function read(abbreviation) {
    const state = await State.query().select().where('id', abbreviation);
    
    console.log(`READ\n ${state}`);
}

async function update() {}

async function deleteTest(abbreviation) {
    const state = await state.query().del().where('id', abbreviation);

    console.log(`DELETE\n ${state}`);
}

async function main() {
    await create();
    await read('IN');
    await update();
    await deleteTest('IN');

    knex.destroy();
}

process.on("unhandledRejection", (err) => {
    console.error(err);
    process.exit(1);
  });
  
  main();