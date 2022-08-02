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
  await User.relatedQuery('driver').for(id).unrelate();
  await User.relatedQuery('ride').for(id).unrelate();

  let user = await User.query().deleteById(id).returning('*');

  console.log('DELETE\n', user);
}

async function main() {
  //await create();
  //await read(8);
  //await update();
  //await deleteTest(9);

  const pass = await User.query().withGraphFetched('ride').where('id', 10);
  console.log(pass);
  
  knex.destroy();
}

process.on("unhandledRejection", (err) => {
  console.error(err);
  process.exit(1);
});

main();
