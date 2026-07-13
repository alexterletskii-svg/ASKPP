var pipwerks = pipwerks || {};

pipwerks.UTILS = {
    StringToBoolean: function(string){
        switch(string.toLowerCase()) {
            case "true": case "yes": case "1": return true;
            case "false": case "no": case "0": case null: return false;
            default: return Boolean(string);
        }
    }
};

pipwerks.debug = { isActive: false };

pipwerks.SCORM = {
    version: null,
    handleCompletionStatus: true,
    handleExitMode: true,
    API: { handle: null, isFound: false },
    connection: { isActive: false },

    data: {
        completionStatus: null,
        exitStatus: null
    },

    isAvailable: function(){
        return true;
    },

    API: {
        get: function(){
            var API = null, win = window, findAPITries = 0;
            while ((!win.API && !win.API_1484_11) && (win.parent) && (win.parent != win) && (findAPITries <= 500)){
                findAPITries++;
                win = win.parent;
            }
            if (pipwerks.SCORM.version === "2004" || win.API_1484_11) {
                API = win.API_1484_11;
                pipwerks.SCORM.version = "2004";
            } else if (pipwerks.SCORM.version === "1.2" || win.API) {
                API = win.API;
                pipwerks.SCORM.version = "1.2";
            }
            if(API){
                pipwerks.SCORM.API.isFound = true;
                pipwerks.SCORM.API.handle = API;
            }
            return API;
        },
        getHandle: function(){
            if(!pipwerks.SCORM.API.handle && !pipwerks.SCORM.API.isFound){
                pipwerks.SCORM.API.get();
            }
            return pipwerks.SCORM.API.handle;
        }
    },

    init: function(){
        var success = false;
        var API = pipwerks.SCORM.API.getHandle();
        if(API){
            switch(pipwerks.SCORM.version){
                case "1.2": success = pipwerks.UTILS.StringToBoolean(API.LMSInitialize("")); break;
                case "2004": success = pipwerks.UTILS.StringToBoolean(API.Initialize("")); break;
            }
            if(success){
                pipwerks.SCORM.connection.isActive = true;
            }
        }
        return success;
    },

    get: function(parameter){
        var value = null;
        if(pipwerks.SCORM.connection.isActive){
            var API = pipwerks.SCORM.API.getHandle();
            switch(pipwerks.SCORM.version){
                case "1.2": value = API.LMSGetValue(parameter); break;
                case "2004": value = API.GetValue(parameter); break;
            }
        }
        return value;
    },

    set: function(parameter, value){
        var success = false;
        if(pipwerks.SCORM.connection.isActive){
            var API = pipwerks.SCORM.API.getHandle();
            switch(pipwerks.SCORM.version){
                case "1.2": success = pipwerks.UTILS.StringToBoolean(API.LMSSetValue(parameter, value)); break;
                case "2004": success = pipwerks.UTILS.StringToBoolean(API.SetValue(parameter, value)); break;
            }
        }
        return success;
    },

    save: function(){
        var success = false;
        if(pipwerks.SCORM.connection.isActive){
            var API = pipwerks.SCORM.API.getHandle();
            switch(pipwerks.SCORM.version){
                case "1.2": success = pipwerks.UTILS.StringToBoolean(API.LMSCommit("")); break;
                case "2004": success = pipwerks.UTILS.StringToBoolean(API.Commit("")); break;
            }
        }
        return success;
    },

    quit: function(){
        var success = false;
        if(pipwerks.SCORM.connection.isActive){
            var API = pipwerks.SCORM.API.getHandle();
            pipwerks.SCORM.save();
            switch(pipwerks.SCORM.version){
                case "1.2": success = pipwerks.UTILS.StringToBoolean(API.LMSFinish("")); break;
                case "2004": success = pipwerks.UTILS.StringToBoolean(API.Terminate("")); break;
            }
            if(success){
                pipwerks.SCORM.connection.isActive = false;
            }
        }
        return success;
    }
};