module.exports = function() {
  var mothers = {};
  var children = {};
  var methods = {};
  
  methods.dump = function() {
    return {mothers, children};
  }
  
  methods.createMomIfNotExists = function(id, accessToken) {
    if (mothers[id] === undefined) {
      mothers[id] = {accessToken: accessToken, children: []};
    }
  };
  
  methods.getMom = function(id) {
    return mothers[id];
  };
  
  methods.createChild = function(id, accessToken) {
    children[id] = {accessToken: accessToken};
  };
  
  methods.addChild = function(momId, childId) {
    if (mothers[momId].children.indexOf(childId) !== -1) {
      mothers[momId].children.push(childId);
    }
  };
  
  return methods;
};
