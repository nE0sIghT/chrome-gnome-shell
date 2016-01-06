/*
    Gnome-shell integration for Chrome
    Copyright (C) 2015  Yuri Konotopov <ykonotopov@gmail.com>

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.
 */

var nativeHost = 'io.github.ne0sight.gs_chrome_connector';

var port = chrome.runtime.connectNative(nativeHost);

port.onMessage.addListener(function(message) {
	if(message && message.signal && message.signal === 'ExtensionStatusChanged')
	{
		chrome.tabs.query(
			{
				url:	'https://extensions.gnome.org/*'
			},
			function(tabs) {
				for(k in tabs)
				{
					chrome.tabs.sendMessage(
						tabs[k].id,
						message
					);
				}
			}
		);
	}
});

function sendNativeRequest(request, sendResponse) {
	if(sendResponse)
	{
		chrome.runtime.sendNativeMessage(
			nativeHost,
			request,
			function (response) {
				if (response && response.success)
				{
					sendResponse(response);
				}
				else
				{
					sendResponse(
						{
							success: false,
							message: "No host response"
						}
					);
				}
			}
		);
	}
	else
	{
		chrome.runtime.sendNativeMessage(nativeHost, request);
	}
}

chrome.runtime.onMessageExternal.addListener(
	function (request, sender, sendResponse) {
		if (sender.url.startsWith('https://extensions.gnome.org/'))
		{
			if (
				request &&
				request.execute
			)
			{
				if(["listExtensions", "ShellVersion"].indexOf(request.execute) !== -1)
				{
					sendNativeRequest({ execute: request.execute }, sendResponse);
					return true;
				}
				else if(["launchExtensionPrefs"].indexOf(request.execute) !== -1)
				{
					sendNativeRequest({ execute: request.execute, uuid: request.uuid });
				}
				else if(["getExtensionErrors", "getExtensionInfo"].indexOf(request.execute) !== -1)
				{
					sendNativeRequest({ execute: request.execute, uuid: request.uuid }, sendResponse);
					return true;
				}
				else if (request.execute === 'EnableExtension')
				{
					sendNativeRequest(
						{
							execute:	request.execute,
							uuid:		request.uuid,
							enable:		request.enable
						},
						sendResponse
					);
					return true;
				}
			}
		}
	});
