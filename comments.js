var mapping = require('./commentMapping.js');

commentingTools = {
    parsingPost: function parsingPost(newInput){
        var statusDescription = ''.concat(newInput.message)
            .concat(newInput.story)
            .concat(newInput.description)
            .concat(newInput.caption);

        if(newInput.place){
            statusDescription.concat(newInput.place.name);
        }
        return statusDescription.toLowerCase();
    },

    makeComments: function makeComments(postContent){
        var keys = Object.keys(mapping);

        for(var i=0; i< keys.length; i++){
            if(postContent.indexOf(keys[i]) > -1){
                return mapping[keys[i]];
            }
        }
    }
};


module.exports = commentingTools;
