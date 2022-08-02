const { knex } = require("./init");

//const { default: knex } = require("knex");
const User = require("../models/User.js");

async function create() {
  const newUser = await User.query().insert(
        {
            firstName: 'Pat',
            lastName: 'Rick',
            email: 'pr@gmail.com',
            password: 'patty',
            phone: '209-456-3201',
            isAdmin: false,
        }
    )
  console.log("CREATE\n", newUser);
}

async function read(id) {
  const user = await User.query().select().where('id', id);

  console.log('READ\n', user);

}

async function update() {}

async function deleteTest(id) {
  const user = await User.query().del().where('id', 10);

  console.log('DELETE\n', user);
}

async function main() {
  //await create();
  //await read(8);
  await update();
  //await deleteTest();
  
   knex.destroy();
}

process.on("unhandledRejection", (err) => {
  console.error(err);
  process.exit(1);
});

main();
