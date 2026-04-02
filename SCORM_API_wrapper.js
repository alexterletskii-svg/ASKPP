/* =========================================================================
 * pipwerks SCORM API Wrapper for JavaScript
 * v1.1.20110908
 * ========================================================================= */

var pipwerks = {};

pipwerks.UTILS = {
    StringToBoolean: function(string){
        switch(string.toLowerCase()) {
            case "true": case "yes": case "1": return true;
            case "false": case "no": case "0": case null: return false;
            default: return Boolean(string);
        }
    },
    trace: function(msg){
        if(this.trace.isActive){
            if(window.console && window.console.log){
                window.console.log(msg);
            }
        }
    }
};

pipwerks.UTILS.trace.isActive = true;

pipwerks.SCORM = {
    version: null,
    handleCompletionStatus: true,
    handleExitMode: true,
    API: { handle: null, isFound: false },
    connection: { isActive: false },
    data: { completionStatus: null, exitStatus: null },
    debug: { getCode: null, getInfo: null, getDiagnosticInfo: null }
};

pipwerks.SCORM.isAvailable = function(){ return true; };

pipwerks.SCORM.API.find = function(win){
    var API = null, findAttempts = 0, findAttemptLimit = 500, traceMsgPrefix = "SCORM.API.find";
    while ((!win.API && !win.API_1484_11) && (win.parent) && (win.parent != win) && (findAttempts <= findAttemptLimit)){
        findAttempts++;
        win = win.parent;
    }
    if(pipwerks.SCORM.version){
        switch(pipwerks.SCORM.version){
            case "2004": if(win.API_1484_11){ API = win.API_1484_11; } else { pipwerks.UTILS.trace(traceMsgPrefix +": SCORM version 2004 was specified by user, but API_1484_11 cannot be found."); } break;
            case "1.2":  if(win.API){ API = win.API; } else { pipwerks.UTILS.trace(traceMsgPrefix +": SCORM version 1.2 was specified by user, but API cannot be found."); } break;
        }
    } else {
        if(win.API_1484_11) { pipwerks.SCORM.version = "2004"; API = win.API_1484_11; }
        else if(win.API){ pipwerks.SCORM.version = "1.2"; API = win.API; }
    }
    if(API){
        pipwerks.UTILS.trace(traceMsgPrefix +": API found. Version: " +pipwerks.SCORM.version);
        pipwerks.UTILS.trace("API: " +API);
    } else {
        pipwerks.UTILS.trace(traceMsgPrefix +": Error finding API. \nFind attempts: " +findAttempts +". \nFind attempt limit: " +findAttemptLimit);
    }
    return API;
};

pipwerks.SCORM.API.get = function(){
    var API = null, win = window;
    API = pipwerks.SCORM.API.find(win);
    if(!API && win.parent && win.parent != win){ API = pipwerks.SCORM.API.find(win.parent); }
    if(!API && win.top && win.top.opener){ API = pipwerks.SCORM.API.find(win.top.opener); }
    if(!API && win.top && win.top.opener && win.top.opener.document){ API = pipwerks.SCORM.API.find(win.top.opener.document); }
    if(API){
        pipwerks.SCORM.API.isFound = true;
        pipwerks.SCORM.API.handle = API;
    } else {
        pipwerks.UTILS.trace("API.get failed: Can't find the API!");
    }
    return API;
};

pipwerks.SCORM.API.getHandle = function() {
    if(!pipwerks.SCORM.API.handle && !pipwerks.SCORM.API.isFound){ pipwerks.SCORM.API.get(); }
    return pipwerks.SCORM.API.handle;
};

pipwerks.SCORM.connection.initialize = function(){
    var success = false, traceMsgPrefix = "SCORM.connection.initialize ";
    pipwerks.UTILS.trace("connection.initialize called.");
    if(!pipwerks.SCORM.connection.isActive){
        var API = pipwerks.SCORM.API.getHandle(), errorCode = 0;
        if(API){
            switch(pipwerks.SCORM.version){
                case "1.2" : success = pipwerks.UTILS.StringToBoolean(API.LMSInitialize("")); break;
                case "2004": success = pipwerks.UTILS.StringToBoolean(API.Initialize("")); break;
            }
            if(success){
                errorCode = pipwerks.SCORM.debug.getCode();
                if(errorCode !== null && errorCode === 0){
                    pipwerks.SCORM.connection.isActive = true;
                    if(pipwerks.SCORM.handleCompletionStatus){
                        pipwerks.SCORM.data.completionStatus = pipwerks.SCORM.status("get");
                    }
                } else {
                    success = false;
                    pipwerks.UTILS.trace(traceMsgPrefix +"failed. \nError code: " +errorCode +" \nError info: " +pipwerks.SCORM.debug.getInfo(errorCode));
                }
            } else {
                errorCode = pipwerks.SCORM.debug.getCode();
                if(errorCode !== null && errorCode !== 0){
                    pipwerks.UTILS.trace(traceMsgPrefix +"failed. \nError code: " +errorCode +" \nError info: " +pipwerks.SCORM.debug.getInfo(errorCode));
                } else {
                    pipwerks.UTILS.trace(traceMsgPrefix +"failed: No response from server.");
                }
            }
        } else {
            pipwerks.UTILS.trace(traceMsgPrefix +"failed: API is null.");
        }
    } else {
        pipwerks.UTILS.trace(traceMsgPrefix +"aborted: Connection already active.");
    }
    return success;
};

pipwerks.SCORM.connection.terminate = function(){
    var success = false, traceMsgPrefix = "SCORM.connection.terminate ";
    if(pipwerks.SCORM.connection.isActive){
        var API = pipwerks.SCORM.API.getHandle(), errorCode = 0;
        if(API){
            if(pipwerks.SCORM.handleExitMode && !pipwerks.SCORM.data.exitStatus){
                if(pipwerks.SCORM.data.completionStatus !== "completed" && pipwerks.SCORM.data.completionStatus !== "passed"){
                    switch(pipwerks.SCORM.version){
                        case "1.2" : success = pipwerks.SCORM.set("cmi.core.exit", "suspend"); break;
                        case "2004": success = pipwerks.SCORM.set("cmi.exit", "suspend"); break;
                    }
                } else {
                    switch(pipwerks.SCORM.version){
                        case "1.2" : success = pipwerks.SCORM.set("cmi.core.exit", "logout"); break;
                        case "2004": success = pipwerks.SCORM.set("cmi.exit", "normal"); break;
                    }
                }
            }
            pipwerks.SCORM.save();
            switch(pipwerks.SCORM.version){
                case "1.2" : success = pipwerks.UTILS.StringToBoolean(API.LMSFinish("")); break;
                case "2004": success = pipwerks.UTILS.StringToBoolean(API.Terminate("")); break;
            }
            if(success){ pipwerks.SCORM.connection.isActive = false; } else {
                errorCode = pipwerks.SCORM.debug.getCode();
                pipwerks.UTILS.trace(traceMsgPrefix +"failed. \nError code: " +errorCode +" \nError info: " +pipwerks.SCORM.debug.getInfo(errorCode));
            }
        } else {
            pipwerks.UTILS.trace(traceMsgPrefix +"failed: API is null.");
        }
    } else {
        pipwerks.UTILS.trace(traceMsgPrefix +"aborted: Connection already terminated.");
    }
    return success;
};

pipwerks.SCORM.data.get = function(parameter){
    var value = null, traceMsgPrefix = "SCORM.data.get(" +parameter +") ";
    if(pipwerks.SCORM.connection.isActive){
        var API = pipwerks.SCORM.API.getHandle(), errorCode = 0;
        if(API){
            switch(pipwerks.SCORM.version){
                case "1.2" : value = API.LMSGetValue(parameter); break;
                case "2004": value = API.GetValue(parameter); break;
            }
            errorCode = pipwerks.SCORM.debug.getCode();
            if(value !== "" || errorCode === 0){
                switch(parameter){
                    case "cmi.core.lesson_status": case "cmi.completion_status": pipwerks.SCORM.data.completionStatus = value; break;
                    case "cmi.core.exit": case "cmi.exit": pipwerks.SCORM.data.exitStatus = value; break;
                }
            } else {
                pipwerks.UTILS.trace(traceMsgPrefix +"failed. \nError code: " +errorCode +"\nError info: " +pipwerks.SCORM.debug.getInfo(errorCode));
            }
        } else { pipwerks.UTILS.trace(traceMsgPrefix +"failed: API is null."); }
    } else { pipwerks.UTILS.trace(traceMsgPrefix +"failed: API connection is inactive."); }
    pipwerks.UTILS.trace(traceMsgPrefix +" value: " +value);
    return String(value);
};

pipwerks.SCORM.data.set = function(parameter, value){
    var success = false, traceMsgPrefix = "SCORM.data.set(" +parameter +") ";
    if(pipwerks.SCORM.connection.isActive){
        var API = pipwerks.SCORM.API.getHandle(), errorCode = 0;
        if(API){
            switch(pipwerks.SCORM.version){
                case "1.2" : success = pipwerks.UTILS.StringToBoolean(API.LMSSetValue(parameter, value)); break;
                case "2004": success = pipwerks.UTILS.StringToBoolean(API.SetValue(parameter, value)); break;
            }
            if(success){
                if(parameter === "cmi.core.lesson_status" || parameter === "cmi.completion_status"){ pipwerks.SCORM.data.completionStatus = value; }
            } else {
                errorCode = pipwerks.SCORM.debug.getCode();
                pipwerks.UTILS.trace(traceMsgPrefix +"failed. \nError code: " +errorCode +". \nError info: " +pipwerks.SCORM.debug.getInfo(errorCode));
            }
        } else { pipwerks.UTILS.trace(traceMsgPrefix +"failed: API is null."); }
    } else { pipwerks.UTILS.trace(traceMsgPrefix +"failed: API connection is inactive."); }
    return success;
};

pipwerks.SCORM.data.save = function(){
    var success = false, traceMsgPrefix = "SCORM.data.save failed";
    if(pipwerks.SCORM.connection.isActive){
        var API = pipwerks.SCORM.API.getHandle();
        if(API){
            switch(pipwerks.SCORM.version){
                case "1.2" : success = pipwerks.UTILS.StringToBoolean(API.LMSCommit("")); break;
                case "2004": success = pipwerks.UTILS.StringToBoolean(API.Commit("")); break;
            }
        } else { pipwerks.UTILS.trace(traceMsgPrefix +": API is null."); }
    } else { pipwerks.UTILS.trace(traceMsgPrefix +": API connection is inactive."); }
    return success;
};

pipwerks.SCORM.status = function(action, status){
    var success = false, traceMsgPrefix = "SCORM.getStatus failed", cmi = "";
    if(action !== null){
        switch(pipwerks.SCORM.version){
            case "1.2" : cmi = "cmi.core.lesson_status"; break;
            case "2004": cmi = "cmi.completion_status"; break;
        }
        switch(action){
            case "get": success = pipwerks.SCORM.data.get(cmi); break;
            case "set": if(status !== null){ success = pipwerks.SCORM.data.set(cmi, status); } else { success = false; pipwerks.UTILS.trace(traceMsgPrefix +": status was not specified."); } break;
            default: success = false; pipwerks.UTILS.trace(traceMsgPrefix +": no valid action was specified.");
        }
    } else { pipwerks.UTILS.trace(traceMsgPrefix +": action was not specified."); }
    return success;
};

pipwerks.SCORM.debug.getCode = function(){
    var API = pipwerks.SCORM.API.getHandle(), code = 0;
    if(API){
        switch(pipwerks.SCORM.version){
            case "1.2" : code = parseInt(API.LMSGetLastError(), 10); break;
            case "2004": code = parseInt(API.GetLastError(), 10); break;
        }
    }
    return code;
};

pipwerks.SCORM.debug.getInfo = function(errorCode){
    var API = pipwerks.SCORM.API.getHandle(), result = "";
    if(API){
        switch(pipwerks.SCORM.version){
            case "1.2" : result = API.LMSGetErrorString(errorCode.toString()); break;
            case "2004": result = API.GetErrorString(errorCode.toString()); break;
        }
    }
    return String(result);
};

// Shortcuts
pipwerks.SCORM.init = pipwerks.SCORM.connection.initialize;
pipwerks.SCORM.get  = pipwerks.SCORM.data.get;
pipwerks.SCORM.set  = pipwerks.SCORM.data.set;
pipwerks.SCORM.save = pipwerks.SCORM.data.save;
pipwerks.SCORM.quit = pipwerks.SCORM.connection.terminate;
