/*
    Gnome-shell integration for Chrome
    Copyright (C) 2015  Yuri Konotopov <ykonotopov@gmail.com>

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.
 */

define('gs-chrome', ['jquery'], function($) {
    "use strict";

	window.SweetTooth = function() {
		var apiObject			= {
			ready:			$.Deferred(),

			apiVersion:		5,
			shellVersion:		'-1',

			getChromeExtensionId:	function() {
				return GS_CHROME_ID;
			},

			getExtensionErrors:	function(uuid) {
				return sendResolveExtensionMessage("getExtensionErrors", "extensionErrors", {uuid: uuid});
			},

			getExtensionInfo:	function(uuid) {
				return sendResolveExtensionMessage("getExtensionInfo", "extensionInfo", {uuid: uuid});
			},

			launchExtensionPrefs:	function(uuid) {
				sendExtensionMessage("launchExtensionPrefs", null, { uuid: uuid });
			},

			listExtensions:		function() {
				return sendResolveExtensionMessage("listExtensions", "extensions");
			},

			setExtensionEnabled:	function(uuid, enable) {
				return sendResolveExtensionMessage("EnableExtension", "success", {uuid: uuid, enable: enable});
			}
		};

		sendResolveExtensionMessage("ShellVersion", "shellVersion", null, apiObject.ready);

		window.addEventListener("message", function(event) {
			// We only accept messages from ourselves
			if (event.source != window)
				return;

			if (event.data.type)
			{
				if(event.data.type == "gs-chrome-onchange")
				{
					apiObject.onchange(
						event.data.request.parameters[0],
						event.data.request.parameters[1],
						event.data.request.parameters[2]
					);
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
					var message = response && response.message ? response.message : "Wrong extension response received";
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
        // Make a new completed promise -- when we move the plugin
        // over to async, we can remove this.
        return (new $.Deferred()).resolve(result);
    }

    function _makePromise(result) {
        return _makeRawPromise(JSON.parse(result));
    }

    return {
        _makePromise: _makePromise,

        ListExtensions: function() {
            return API.listExtensions();
        },

        GetExtensionInfo: function(uuid) {
            return API.getExtensionInfo(uuid);
        },

        GetErrors: function(uuid) {
            return API.getExtensionErrors(uuid);
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
            return API.installExtension(uuid);
        },

        InstallExtensionTwo: function(uuid) {
            return API.installExtension(uuid, "");
        },

        InstallExtensionAsync: function(uuid) {
            var d = new $.Deferred();
            API.installExtension(uuid, d.done.bind(d), d.fail.bind(d));
            return d;
        },

        UninstallExtension: function(uuid) {
            return API.uninstallExtension(uuid);
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
	SweetTooth.ready.done(function(version) {
		SweetTooth.shellVersion = version;
	}).fail(function() {
		messages.addWarning('Although Gnome-shell extension for Chrome is running, we cannot detect a native Gnome-shell integration connector. Please make sure it properly installed.');
	}).always(function() {

		// Start extensions.gnome.org main script
		require(['main'], function(){});
	});
});
