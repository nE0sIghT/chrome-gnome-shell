/*
    Gnome-shell integration for Chrome
    Copyright (C) 2016  Yuri Konotopov <ykonotopov@gmail.com>

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.
 */

chrome.runtime.onInstalled.addListener(function(details) {
	var version = chrome.runtime.getManifest().version;

	if(details.reason == chrome.runtime.OnInstalledReason.UPDATE && details.previousVersion != version)
	{
		chrome.storage.sync.get(DEFAULT_OPTIONS, function (options) {
			if(options.showReleaseNotes)
			{
				chrome.tabs.create({
					url: 'https://github.com/nE0sIghT/chrome-gnome-shell/releases/tag/v' + version,
					active: true
				});
			}
		});
	}
});

chrome.runtime.onMessageExternal.addListener(function (request, sender, sendResponse) {
	if (sender.url.startsWith('https://extensions.gnome.org/'))
	{
		if (request && request.execute)
		{
			if (request.uuid && !GSC.isUUID(request.uuid))
			{
				return;
			}

			switch (request.execute)
			{
				case 'initialize':
				case 'listExtensions':
					GSC.sendNativeRequest({execute: request.execute}, sendResponse);
					return true;

				case 'launchExtensionPrefs':
					GSC.sendNativeRequest({execute: request.execute, uuid: request.uuid});
					break;

				case 'getExtensionErrors':
				case 'getExtensionInfo':
				case 'installExtension':
				case 'uninstallExtension':
					GSC.sendNativeRequest({execute: request.execute, uuid: request.uuid}, sendResponse);
					return true;

				case 'enableExtension':
					GSC.sendNativeRequest({
						execute: request.execute,
						uuid: request.uuid,
						enable: request.enable
					},
					sendResponse
						);
					return true;
			}
		}
	}
});

var port = chrome.runtime.connectNative(NATIVE_HOST);
port.onMessage.addListener(function (message) {
	if (message && message.signal && ["ExtensionStatusChanged", "org.gnome.Shell"].indexOf(message.signal) !== -1)
	{
		chrome.tabs.query({
			url: 'https://extensions.gnome.org/*'
		},
		function (tabs) {
			for (k in tabs)
			{
				chrome.tabs.sendMessage(tabs[k].id, message);
			}
		});
	}
});

GSC.update.init();
