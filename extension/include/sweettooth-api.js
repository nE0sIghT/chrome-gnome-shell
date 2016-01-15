/*
    Gnome-shell integration for Chrome
    Copyright (C) 2016  Yuri Konotopov <ykonotopov@gmail.com>

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.
 */

GSC.getMessage = function(key) {
	if(GSC && GSC.i18n && GSC.i18n[key])
	{
		var message = GSC.i18n[key];

		for(var i = 1; i < arguments.length; i++)
		{
			message = message.replace('$' + i, arguments[i]);
		}

		return message;
	}

	return key;
};

define('gs-chrome', ['jquery'], function($) {
    "use strict";

	window.SweetTooth = function() {
		var apiObject			= {
			ready:				$.Deferred(),

			apiVersion:			5,
			shellVersion:			'-1',
			versionValidationEnabled:	true,

			getChromeExtensionId:	function() {
				return GS_CHROME_ID;
			},

			getExtensionErrors:	function(uuid) {
				return sendResolveExtensionMessage("getExtensionErrors", "extensionErrors", {uuid: uuid});
			},

			getExtensionInfo:	function(uuid) {
				return sendResolveExtensionMessage("getExtensionInfo", "extensionInfo", {uuid: uuid});
			},

			installExtension:	function(uuid) {
				return sendResolveExtensionMessage("installExtension", "status", {uuid: uuid});
			},

			launchExtensionPrefs:	function(uuid) {
				sendExtensionMessage("launchExtensionPrefs", null, { uuid: uuid });
			},

			listExtensions:		function() {
				return sendResolveExtensionMessage("listExtensions", "extensions");
			},

			setExtensionEnabled:	function(uuid, enable) {
				return sendResolveExtensionMessage("enableExtension", "success", {uuid: uuid, enable: enable});
			},

			uninstallExtension:	function(uuid) {
				return sendResolveExtensionMessage("uninstallExtension", "success", {uuid: uuid});
			}
		};

		sendResolveExtensionMessage("initialize", "properties", null, apiObject.ready);

		window.addEventListener("message", function(event) {
			// We only accept messages from ourselves
			if (event.source != window)
				return;

			if (event.data.type)
			{
				if(event.data.type == "gs-chrome")
				{
					if(event.data.request.signal == 'ExtensionStatusChanged' && apiObject.onchange)
					{
						apiObject.onchange(
							event.data.request.parameters[0],
							event.data.request.parameters[1],
							event.data.request.parameters[2]
						);
					}
					else if(event.data.request.signal == 'org.gnome.Shell' && apiObject.onshellrestart)
					{
						apiObject.onshellrestart();
					}
				}
			}
		}, false);

		function sendResolveExtensionMessage(method, resolveProperty, parameters, deferred)
		{
			function resolveOnSuccess(response, deferred, value)
			{
				if(response && response.success)
				{
					deferred.resolve(value);
				}
				else
				{
					var message = response && response.message ? response.message : GSC.getMessage('error_extension_response');
					deferred.reject(message);
				}
			}

			if(!deferred)
			{
				deferred = $.Deferred();
			}

			sendExtensionMessage(method, function(response) {
					resolveOnSuccess(response, deferred, response[resolveProperty]);
				},
				parameters
			);

			return deferred;
		}

		function sendExtensionMessage(method, callback, parameters)
		{
			var request = { execute: method };
			if(parameters)
				request = $.extend(parameters, request);

			chrome.runtime.sendMessage(
				apiObject.getChromeExtensionId(),
				request,
				callback
			);
		}

		return apiObject;
	} ();
});

define('versions/common/common', ['jquery', 'dbus!API'], function($, API) {
    "use strict";

     function _makeRawPromise(result) {
        // Check if result is promise already
        if(isPromise(result))
            return result;

        return (new $.Deferred()).resolve(result);
    }

    function _makePromise(result) {
        // Check if result is promise already
        if(isPromise(result))
            return result;

        return _makeRawPromise(JSON.parse(result));
    }

    function isPromise(value) {
        return value && value.promise;
    }

    return {
        _makePromise: _makePromise,

        ListExtensions: function() {
            return _makePromise(API.listExtensions());
        },

        GetExtensionInfo: function(uuid) {
            return _makePromise(API.getExtensionInfo(uuid));
        },

        GetErrors: function(uuid) {
            return _makePromise(API.getExtensionErrors(uuid));
        },

        LaunchExtensionPrefs: function(uuid) {
            return API.launchExtensionPrefs(uuid);
        },

        LaunchExtensionPrefsDummy: function(uuid) { },

        EnableExtension: function(uuid) {
            API.setExtensionEnabled(uuid, true);
        },

        DisableExtension: function(uuid) {
            API.setExtensionEnabled(uuid, false);
        },

        InstallExtensionOne: function(uuid) {
            var result = API.installExtension(uuid);

	    if(isPromise(result))
		    return result;

            return _makeRawPromise('succeeded');
        },

        InstallExtensionTwo: function(uuid) {
            var result = API.installExtension(uuid, "");

	    if(isPromise(result))
		    return result;

            return _makeRawPromise('succeeded');
        },

        InstallExtensionAsync: function(uuid) {
            var d = new $.Deferred();
            var result = API.installExtension(uuid, d.done.bind(d), d.fail.bind(d));

	    if(isPromise(result))
		    return result;

            return d;
        },

        UninstallExtension: function(uuid) {
            return _makePromise(API.uninstallExtension(uuid));
        },

        API_onchange: function(proxy) {
            return function(uuid, newState, error) {
                if (proxy.extensionStateChangedHandler !== null)
                    proxy.extensionStateChangedHandler(uuid, newState, error);
            };
        },

        API_onshellrestart: function(proxy) {
            return function() {
                if (proxy.shellRestartHandler !== null)
                    proxy.shellRestartHandler();
            };
        }
    };
});

gs_chrome_initialized = true;
require(['messages', 'gs-chrome'], function(messages){
	SweetTooth.ready.done(function(response) {
		SweetTooth.shellVersion			= response.shellVersion;
		SweetTooth.versionValidationEnabled	= response.versionValidationEnabled;

		if(!response.connectorVersion || response.connectorVersion != GS_CHROME_VERSION)
		{
			if(!response.connectorVersion)
				response.connectorVersion = GSC.getMessage('older_connector');
			else
				response.connectorVersion = GSC.getMessage('version', response.connectorVersion);

			messages.addWarning(GSC.getMessage('warning_versions_mismatch', GSC.getMessage('version', GS_CHROME_VERSION), response.connectorVersion));
		}
	}).fail(function() {
		messages.addWarning(GSC.getMessage('no_host_connector'));
	}).always(function() {
		// Start extensions.gnome.org main script
		require(['main'], function(){});
	});
});
