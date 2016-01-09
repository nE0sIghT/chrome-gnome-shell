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
		chrome.tabs.create({
			url: 'https://github.com/nE0sIghT/chrome-gnome-shell/releases/tag/v' + version,
			active: true
		});
	}
});

(function() {
	var nativeHost = 'io.github.ne0sight.gs_chrome_connector';

	function init()
	{
		var port = chrome.runtime.connectNative(nativeHost);
		port.onMessage.addListener(function(message) {
			if(message && message.signal && ["ExtensionStatusChanged", "org.gnome.Shell"].indexOf(message.signal) !== -1)
			{
				chrome.tabs.query({
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

		chrome.runtime.onMessageExternal.addListener(function (request, sender, sendResponse) {
			if (sender.url.startsWith('https://extensions.gnome.org/'))
			{
				if (request && request.execute)
				{
					if(request.uuid && !isUUID(request.uuid))
					{
						return;
					}

					switch(request.execute)
					{
						case 'initialize':
						case 'listExtensions':
							sendNativeRequest({ execute: request.execute }, sendResponse);
							return true;

						case 'launchExtensionPrefs':
							sendNativeRequest({ execute: request.execute, uuid: request.uuid });
							break;

						case 'getExtensionErrors':
						case 'getExtensionInfo':
						case 'installExtension':
						case 'uninstallExtension':
							sendNativeRequest({ execute: request.execute, uuid: request.uuid }, sendResponse);
							return true;

						case 'enableExtension':
							sendNativeRequest({
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
	}

	// https://wiki.gnome.org/Projects/GnomeShell/Extensions/UUIDGuidelines
	function isUUID(uuid)
	{
		return uuid && uuid.match('^[-a-zA-Z0-9@._]+$');
	}

	function sendNativeRequest(request, sendResponse) {
		if(sendResponse)
		{
			chrome.runtime.sendNativeMessage(
				nativeHost,
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
			chrome.runtime.sendNativeMessage(nativeHost, request);
		}
	}	

	init()
})();

// Update check handler
(function($) {
	var NOTIFICATION_UPDATE_AVAILABLE	= 'gs-chrome-update';
	var NOTIFICATION_UPDATE_CHECK_FAILED	= 'gs-chrome-update-fail';
	var ALARM_UPDATE_CHECK			= 'gs-chrome-update-check';

	var defaultOptions			= {
		updateCheck:		true,
		updateCheckPeriod:	6
	};

	function init() {
		chrome.storage.sync.get(defaultOptions, function (options) {
			if (options.updateCheck)
			{
				chrome.alarms.onAlarm.addListener(function (alarm) {
					if (alarm.name === ALARM_UPDATE_CHECK)
					{
						check_updates();
					}
				});

				chrome.notifications.onClosed.addListener(function (notificationId, byUser) {
					if (!byUser)
					{
						updateNotification(notificationId);
					}
					else
					{
						removeNotification(notificationId);
					}
				});

				chrome.notifications.onClicked.addListener(function (notificationId) {
					if(notificationId === NOTIFICATION_UPDATE_AVAILABLE)
					{
						chrome.tabs.create({
							url: 'https://extensions.gnome.org/local/',
							active: true
						});
					}

					removeNotification(notificationId);
				});

				chrome.notifications.onButtonClicked.addListener(function (notificationId, buttonIndex) {
					removeNotification(notificationId);
				});

				chrome.alarms.get(ALARM_UPDATE_CHECK, function (alarm) {
					if (!alarm || !alarm.periodInMinutes || alarm.periodInMinutes !== options.updateCheckPeriod * 60)
					{
						schedule_update(options.updateCheckPeriod);
					}
				});

				chrome.storage.local.get({
					notifications: {}
				}, function (items) {
					var notifications = items.notifications;

					for (notificationId in notifications)
					{
						updateNotification(notificationId);
					}
				});
			}

			chrome.storage.onChanged.addListener(function(changes, areaName) {
				if(changes.updateCheck)
				{
					if(!changes.updateCheck.newValue)
					{
						chrome.alarms.clear(ALARM_UPDATE_CHECK);
					}
					else
					{
						chrome.storage.sync.get(defaultOptions, function (options) {
							schedule_update(options.updateCheckPeriod);
						});
					}
				}
				else if(changes.updateCheckPeriod)
				{
					chrome.storage.sync.get(defaultOptions, function (options) {
						if(options.updateCheck)
						{
							schedule_update(options.updateCheckPeriod);
						}
					});
				}
			});
		});
	}

	function schedule_update(updateCheckPeriod) {
		check_updates();

		chrome.alarms.create(
			ALARM_UPDATE_CHECK,
			{
				delayInMinutes: updateCheckPeriod * 60,
				periodInMinutes: updateCheckPeriod * 60
			}
		);
	}

	function check_updates() {
		sendNativeRequest({execute: 'initialize'}, function (response) {
			if (response.success)
			{
				var shellVersion = response.properties.shellVersion;

				sendNativeRequest({execute: 'listExtensions'}, function (extensionsResponse) {
					if (response.success)
					{
						var request = {
							shell_version: shellVersion,
							installed: {}
						};

						for (uuid in extensionsResponse.extensions)
						{
							request.installed[uuid] = {version: extensionsResponse.extensions[uuid].version};
						}

						request.installed = JSON.stringify(request.installed);

						$.ajax({
							url: 'https://extensions.gnome.org/update-info/',
							data: request,
							method: 'GET',
							cache: false
						}).done(function (data, textStatus, jqXHR) {
							removeNotification(NOTIFICATION_UPDATE_CHECK_FAILED);

							var toUpgrade = [];
							for (uuid in data)
							{
								if (extensionsResponse.extensions[uuid] && $.inArray(data[uuid], ['upgrade', 'downgrade']) !== -1)
								{
									toUpgrade.push({
										title: extensionsResponse.extensions[uuid].name,
										message: {
											upgrade: 'can be upgraded',
											downgrade: 'must be downgraded'
										}[data[uuid]]
									});
								}
							}

							if (toUpgrade.length > 0)
							{
								createNotification(NOTIFICATION_UPDATE_AVAILABLE, {
									type: chrome.notifications.TemplateType.LIST,
									title: 'An update for Gnome-shell extensions available',
									message: '',
									items: toUpgrade
								});
							}
						}).fail(function (jqXHR, textStatus, errorThrown) {
							createNotification(NOTIFICATION_UPDATE_CHECK_FAILED, {
								message: 'Failed to check extensions updates: ' + textStatus
							});
						});
					}
				});
			}
		});
	}

	function createNotification(name, options)
	{
		chrome.storage.local.get({
			notifications: {}
		}, function (items) {
			var notifications = items.notifications;

			notifications[name] = $.extend({
				type: chrome.notifications.TemplateType.BASIC,
				iconUrl: 'icons/GnomeLogo-128.png',
				title: 'Gnome-shell integration',
				buttons: [
					{title: 'Close'}
				],
				priority: 2,
				isClickable: true
			}, options);

			_createNotification(name, notifications[name], function (notificationId) {
				chrome.storage.local.set({
					notifications: notifications
				});

				updateNotification(notificationId);
			});
		});
	}

	function _createNotification(name, options, callback)
	{
		if (callback)
		{
			chrome.notifications.create(name, options, callback);
		}
		else
		{
			chrome.notifications.create(name, options);
		}
	}

	function updateNotification(notificationId)
	{
		chrome.storage.local.get({
			notifications: {}
		}, function (items) {
			var notifications = items.notifications;

			if (notifications[notificationId])
			{
				_createNotification(notificationId, notifications[notificationId]);
			}
		});
	}

	function removeNotification(notificationId)
	{
		chrome.storage.local.get({
			notifications: {}
		}, function (items) {
			var notifications = items.notifications;

			if (notifications[notificationId])
			{
				delete notifications[notificationId];
				chrome.storage.local.set({
					notifications: notifications
				});
			}

			chrome.notifications.clear(notificationId);
		});
	}

	init();
})(jQuery);
