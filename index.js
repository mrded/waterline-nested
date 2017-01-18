'use strict';

var _ = require('lodash');

module.exports.create = function(model, values) {
  var mainModel = sails.models[model];
  var stack = [];

  _.each(mainModel.attributes, function(value, key) {
    if (value.model && typeof values[key] === 'object') {
      var childModel = sails.models[value.model];

      stack.push(childModel.create(values[key]).meta({fetch: true}).then(function(object) {
        values[key] = object.id;
      }));
    }
  });

  return Promise.all(stack).then(function() {
    mainModel.create(values);
  });
};
