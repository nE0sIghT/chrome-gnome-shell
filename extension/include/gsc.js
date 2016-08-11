/*
    GNOME Shell integration for Chrome
    Copyright (C) 2016  Yuri Konotopov <ykonotopov@gmail.com>

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.
 */

GSC = (function() {
	var platform_supported = true;

	chrome.runtime.getPlatformInfo(function(info) {
		if (PLATFORMS_WHITELIST.indexOf(info.os) === -1)
		{
			platform_supported = false;
		}
	});

	return {
		// https://wiki.gnome.org/Projects/GnomeShell/Extensions/UUIDGuidelines
		isUUID: function(uuid) {
			return uuid && uuid.match('^[-a-zA-Z0-9@._]+$');
		},

		sendNativeRequest: function(request, sendResponse) {
			if(!platform_supported)
			{
				if(sendResponse)
				{
					sendResponse({
						success: false,
						message: m('platform_not_supported')
					});
				}

				return;
			}

			if(sendResponse)
			{
				chrome.runtime.sendNativeMessage(
					NATIVE_HOST,
					request,
					function (response) {
						if (response)
						{
							sendResponse(response);
						}
						else
						{
							var message = m('no_host_connector');
							if(
								chrome.runtime.lastError &&
								chrome.runtime.lastError.message &&
								chrome.runtime.lastError.message.indexOf("host not found") === -1
							)
							{
								// Some error occured. Show to user
								message = chrome.runtime.lastError.message;
							}

							sendResponse({
								success: false,
								message: message
							});
						}
					}
				);
			}
			else
			{
				chrome.runtime.sendNativeMessage(NATIVE_HOST, request);
			}
		},

		isSignalsEqual: function(newSignal, oldSignal) {
			if(!oldSignal || !newSignal)
				return false;

			if(!newSignal.signal || !oldSignal.signal || newSignal.signal !== oldSignal.signal)
				return false;

			if(newSignal.parameters)
			{
				if(!oldSignal.parameters)
					return false;

				if(newSignal.parameters.length !== oldSignal.parameters.length)
					return false;

				for(var i = 0; i < newSignal.parameters.length; i++)
				{
					if(newSignal.parameters[i] !== oldSignal.parameters[i])
					{
						return false;
					}
				}
			}
			else if (oldSignal.parameters)
			{
				return false;
			}

			return true;
		}
	};
})();
