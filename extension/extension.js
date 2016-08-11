/*
    GNOME Shell integration for Chrome
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
		chrome.storage.sync.get(DEFAULT_SYNC_OPTIONS, function (options) {
			if(options.showReleaseNotes)
			{
				chrome.tabs.create({
					url: 'https://wiki.gnome.org/Projects/GnomeShellIntegrationForChrome/ReleaseNotes/' + version,
					active: true
				});
			}
		});
	}
});

chrome.runtime.onMessageExternal.addListener(function (request, sender, sendResponse) {
	if (sender.url.startsWith(EXTENSIONS_WEBSITE))
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

var disabledExtensionTimeout = null;
var lastPortMessage = {message: null, date: 0};
var port = chrome.runtime.connectNative(NATIVE_HOST);
/*
 * Native host messaging events handler.
 */
port.onMessage.addListener(function (message) {
	if (message && message.signal && [SIGNAL_EXTENSION_CHANGED, SIGNAL_SHELL_APPEARED].indexOf(message.signal) !== -1)
	{
		/*
		 * Skip duplicate events. This is happens eg when extension is installed.
		 */
		if((new Date().getTime()) - lastPortMessage.date < 1000 && GSC.isSignalsEqual(message, lastPortMessage.message))
		{
			lastPortMessage.date = new Date().getTime();
			return;
		}

		/*
		 * Send events to opened extensions.gnome.org tabs
		 */
		chrome.tabs.query({
			url: EXTENSIONS_WEBSITE + '*'
		},
		function (tabs) {
			for (k in tabs)
			{
				chrome.tabs.sendMessage(tabs[k].id, message);
			}
		});

		/*
		 * Route message to Options page.
		 */
		chrome.runtime.sendMessage(GS_CHROME_ID, message);
		if(message.signal === SIGNAL_EXTENSION_CHANGED)
		{
			/*
			 * GNOME Shell sends 2 events when extension is uninstalled:
			 * "disabled" event and then "uninstalled" event.
			 * Let's delay any "disabled" event and drop it if
			 * "uninstalled" event received within 1,5 secs.
			 */
			if(message.parameters[EXTENSION_CHANGED_STATE] === EXTENSION_STATE.DISABLED)
			{
				disabledExtensionTimeout = setTimeout(function() {
					disabledExtensionTimeout = null;
					GSC.sync.onExtensionChanged(message);
				}, 1500);
			}
			else if(
				disabledExtensionTimeout &&
				message.parameters[EXTENSION_CHANGED_STATE] === EXTENSION_STATE.UNINSTALLED &&
				lastPortMessage.message.signal === SIGNAL_EXTENSION_CHANGED &&
				lastPortMessage.message.parameters[EXTENSION_CHANGED_UUID] === message.parameters[EXTENSION_CHANGED_UUID] &&
				lastPortMessage.message.parameters[EXTENSION_CHANGED_STATE] === EXTENSION_STATE.DISABLED
			)
			{
				clearTimeout(disabledExtensionTimeout);
				disabledExtensionTimeout = null;
				GSC.sync.onExtensionChanged(message);
			}
			else
			{
				GSC.sync.onExtensionChanged(message);
			}
		}

		lastPortMessage = {
			message: message,
			date: new Date().getTime()
		};
	}
});

chrome.runtime.getPlatformInfo(function(info) {
	if (PLATFORMS_WHITELIST.indexOf(info.os) !== -1)
	{
		GSC.update.init();
		GSC.sync.init();
	}
});
