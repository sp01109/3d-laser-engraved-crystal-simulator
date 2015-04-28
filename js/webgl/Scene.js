var Scene = {
    objects : [],
    getObject : function(alias){
        for(var i=0; i<Scene.objects.length; i++){
            if (alias == Scene.objects[i].alias) return Scene.objects[i];
        }
        return null;
    },
    
    addObject : function(object) {
        Scene.objects.push(object);
        
        if (object.remote){
            console.info(object.alias + ' has been added to the scene [Remote]');
         }
         else {
            console.info(object.alias + ' has been added to the scene [Local]');
         }
    },

    clear : function() {
        //keep cube
        for(var i=1; i<Scene.objects.length; i++){
            Scene.objects.pop();
        }
    }
};