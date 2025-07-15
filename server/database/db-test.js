const DataBase = require('./database.js');


console.log('===== Test 1: Adding a new dog')

let new_dog = DataBase.table('dogs').insert({
  username: "linus55",
  name: "Linus",
  dog_type: "Bischon Frise",
  age: "8",
  facts: "Loves testing out database tables!"
});

if (new_dog.error) {
  console.log(`⛔️ Test 1 resulted in an error: ${new_dog.msg}`);
} else {
  console.log(`✅ Test 1 created a dog with this id: ${new_dog.id}`);
}


console.log('===== Test 2: Finding the dog with the username linus55')

let found_dog = DataBase.table('dogs').find({
  username: "linus55"
});

if (found_dog.length == 0) {
  console.log(`⛔️ Test 2 didn't find any matching dogs.`);
} else if (found_dog.length > 1 || !found_dog) {
  console.log(`⛔️ Test 2 returned more than one dog, or an undefined result:`);
  console.log(found_dog);
} else {
  console.log(`✅ Test 2 found a dog with this data: `);
  console.log(found_dog);
}


console.log(`===== Test 3: Updating the dog with the id ${new_dog.id}`)

let update_msg = DataBase.table('dogs').update(new_dog.id, {
  name: 'Linus the Great',
  dog_type: 'Warrior Dog'
});

console.log(update_msg);

console.log('===== Test 4: Finding the dog with username linus55 again')

let found_dog1 = DataBase.table('dogs').find({
  username: "linus55"
});

if (found_dog1.length == 0) {
  console.log(`⛔️ Test 4 didn't find any matching dogs.`);
} else if (found_dog1.length > 1 || !found_dog1) {
  console.log(`⛔️ Test 4 returned more than one dog, or an undefined result:`);
  console.log(found_dog1);
} else {
  console.log(`✅ Test 4 found a dog with this data: `);
  console.log(found_dog1);
  if (found_dog1[0].name == 'Linus the Great' && found_dog1[0].dog_type == 'Warrior Dog') {
    console.log(`✅ Data updated successfully `);
  } else {
    console.log(`⛔️ Data not updated successfully.`);
  }
}


console.log(`===== Test 5: Deleting the newly created dog, with the id ${new_dog.id}`)

let msg = DataBase.table('dogs').delete(new_dog.id);

console.log(msg);

console.log('===== Test 6: Trying to find the dog with username linus55 again')

let found_dog2 = DataBase.table('dogs').find({
  username: "linus55"
});

if (found_dog2.length == 0) {
  console.log(`✅ Test 4 didn't find any matching dogs.`);
} else if (found_dog2.length > 1 || !found_dog2) {
  console.log(`⛔️ Test 4 returned more than one dog, or an undefined result:`);
  console.log(found_dog2);
} else {
  console.log(`⛔️ Test 4 found a dog with this data: `);
  console.log(found_dog2);
}


const readline = require('readline');
const { stdin: input, stdout: output } = require('process');

const rl = readline.createInterface({ input, output });

rl.question('Want to run a test that results in an error? (y/n)', (answer) => {
  if (answer.toLowerCase() == 'y') {
    //  Invalid test
    DataBase.table('not-a-table').insert({
      row1: 'value-1',
      row2: false
    })
  } else {
    console.log("Ok, goodbye!");
  }
  rl.close();
});