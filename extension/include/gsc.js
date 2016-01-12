/*
    Gnome-shell integration for Chrome
    Copyright (C) 2016  Yuri Konotopov <ykonotopov@gmail.com>

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.
 */

GSC = (function() {
	return {
		// https://wiki.gnome.org/Projects/GnomeShell/Extensions/UUIDGuidelines
		isUUID: function(uuid) {
			return uuid && uuid.match('^[-a-zA-Z0-9@._]+$');
		},
		
		sendNativeRequest: function(request, sendResponse) {
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
							sendResponse({
								success: false,
								message: "No host response"
							});
						}
					}
				);
			}
			else
			{
				chrome.runtime.sendNativeMessage(NATIVE_HOST, request);
			}
		}
	};
	
})();