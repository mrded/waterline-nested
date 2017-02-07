'use strict';

var _ = require('lodash');

var createEachNested = function(model, records) {
  if (records && records.length > 0) {
    return createNested(model, records.shift()).then(function() {
      return createEachNested(model, records);
    });
  }
};

var createNested = function(model, values) {
  var mainModel = sails.models[model];

  var associations = {
    one: {},
    many: {}
  };

  // Go through all fields, and try to find included objects.
  _.each(mainModel.attributes, function(value, key) {
    
    // One Way associations.
    if (value.model && typeof values[key] === 'object') {
      associations.one[key] = createNested(value.model, values[key]).then(function(object) {
        values[key] = object.id;
      });
    }

    // Many-to-Many associations.
    if (value.collection && value.dominant && value.through && typeof values[key] === 'object') {
      associations.many[key] = Promise.all(values[key].map(function(object) {
        return createNested(value.collection, object).then(function(object) {
          return object.id;
        });
      }));

      delete values[key];
    }
  });

  var oneWayAssociations = _.values(associations.one);

  return Promise.all(oneWayAssociations).then(function() {
    //@TODO: Remove .meta({fetch: true}) once this issue is solved:
    // - https://github.com/balderdashy/waterline/issues/1444
    // - https://github.com/balderdashy/waterline/pull/1445
    var output = mainModel.findOrCreate(_.clone(values), _.clone(values)).meta({fetch: true});

    return output.then(function(object) {

      // Wait associations.many callbacks and create relations via 'through' model.
      var queries = _.map(associations.many, function(value, key) {
        var attribute = mainModel.attributes[key];
        var refModel = sails.models[attribute.through];

        return value.then(function(ids) {
          return Promise.all(ids.map(function(id) {
            var data = {};

            data[attribute.collection] = id;
            data[attribute.via] = object.id;

            return refModel.create(data);
          }));
        });
      });

      return Promise.all(queries).then(function() {
        return object;
      });
    });
  });
};

module.exports.create = createNested;
module.exports.createEach = createEachNested;
