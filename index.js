'use strict';

var _ = require('lodash');

var createEachNested = function(model, records) {
  if (records && records.length > 0) {
    return createNested(model, records.shift()).then(function(object) {
      return createEachNested(model, records).then(function(objects) {
        objects.push(object);

        return Promise.resolve(objects);  
      });
    });
  }

  return Promise.resolve([]);
};

var getRelationFields = function(model) {
  var Model = sails.models[model];

  var output = [];

  _.each(Model.attributes, function(schema, field) {
    if (schema.hasOwnProperty('model') || schema.hasOwnProperty('collection')) {
      output.push(field);
    }
  });

  return output;
};

var createNested = function(model, values) {
  var mainModel = sails.models[model];

  var fields = getRelationFields(model);

  for (var i in fields) {
    var field = fields[i];

    if (typeof values[field] === 'object') {
      // If the value is an object or array - we need to create it first.

      var relatedSchema = mainModel.attributes[field];

      if (values[field] instanceof Array) {
        // Many-to-Many associations.

        return createEachNested(relatedSchema.collection, values[field]).then(function(relatedObjects) {
          delete values[field];

          return createNested(model, values).then(function(object) {
            // Create relation between objects and new object
            var relatediModel = sails.models[relatedSchema.through];

            var outputPromises = relatedObjects.map(function(relatedObject) {
              var data = {};

              data[relatedSchema.collection] = relatedObject.id;
              data[relatedSchema.via] = object.id;

              return relatediModel.create(data);
            });

            return Promise.all(outputPromises).then(function() {
              return object; 
            }); 
          });
        });
      }
      else {
        // One Way associations.
        
        return createNested(relatedSchema.model, values[field]).then(function(object) {
          values[field] = object.id;

          return createNested(model, values);
        });
      }
    }
  }

  return mainModel.findOrCreate(_.clone(values), _.clone(values));
};

module.exports.create = createNested;
module.exports.createEach = createEachNested;
