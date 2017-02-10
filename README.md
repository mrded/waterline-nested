# Waterline Nested

A simple helper, allows you to do nested creates and updates with Waterline 0.13 (Sails v1.0).

## Installation

- [Latest release](https://github.com/mrded/waterline-nested/releases)
- `npm install waterline-nested`

## Avaliable methods

- `Nested.create(model, record)`
- `Nested.createEach(model, records)`

|   | Argument | Type         | Details                          |
|---|----------|--------------|----------------------------------|
| 1 | model    | `String`     | A model name.                    |
| 2 | record   | `Object`     | An Object that is to be created. |
| 2 | records  | `Array`      | A list of Objects to be created. |

**Returns:** `Promise`

## Usage

```javascript
// myApp/api/models/User.js
// A user may have many pets
module.exports = {
  attributes: {
    firstName: {
      type: 'string'
    },
    lastName: {
      type: 'string'
    },

    // Add a reference to Pets
    pets: {
      collection: 'pet',
      via: 'owner'
    }
  }
};
```

```javascript
// myApp/api/models/Pet.js
// A pet may only belong to a single user
module.exports = {
  attributes: {
    breed: {
      type: 'string'
    },
    type: {
      type: 'string'
    },
    name: {
      type: 'string'
    },

    // Add a reference to User
    owner: {
      model: 'user'
    }
  }
};
```

Now that the pets and users know about each other, they can be associated. To do this we can create or update a pet with the user's object inside.

```javascript
var Nested = require('waterline-nested');

Nested.create('pet', {
  breed: 'labrador',
  type: 'dog',
  name: 'fido',
  owner: { // is User model.
    firstName: {
      type: 'Dmitry'
    },
    lastName: {
      type: 'Demenchuk'
    },
  }
}).exec(function(err) {});
```

It will automativaly create new user and create a pet associated with that user.

## TODOs
- [ ] Add tests.
- [ ] Find a better way to integrate `waterline-nested` with `waterline`.