/*
    Gnome-shell integration for Chrome
    Copyright (C) 2016  Yuri Konotopov <ykonotopov@gmail.com>

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.
 */

GSC.update = (function($) {
	function schedule(updateCheckPeriod) {
		check();

		chrome.alarms.create(
			ALARM_UPDATE_CHECK,
			{
				delayInMinutes: updateCheckPeriod * 60,
				periodInMinutes: updateCheckPeriod * 60
			}
		);
	}

	function check() {
		GSC.sendNativeRequest({execute: 'initialize'}, function (response) {
			if (response.success)
			{
				var shellVersion = response.properties.shellVersion;

				GSC.sendNativeRequest({execute: 'listExtensions'}, function (extensionsResponse) {
					if (response.success)
					{
						if ($.isEmptyObject(extensionsResponse.extensions))
							return;

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
							GSC.notifications.remove(NOTIFICATION_UPDATE_CHECK_FAILED);

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
								GSC.notifications.create(NOTIFICATION_UPDATE_AVAILABLE, {
									type: chrome.notifications.TemplateType.LIST,
									title: 'An update for Gnome-shell extensions available',
									message: '',
									items: toUpgrade
								});
							}

							chrome.storage.local.set({
								lastUpdateCheck: new Date().toLocaleString()
							});
						}).fail(function (jqXHR, textStatus, errorThrown) {
							createUpdateFailedNotification(textStatus);
						});
					}
					else
					{
						createUpdateFailedNotification((response.message ? response.message : '"listExtensions" native request failed'));
					}
				});
			}
			else
			{
				createUpdateFailedNotification((response.message ? response.message : '"initialize" native request failed'));
			}
		});
	}

	function createUpdateFailedNotification(cause) {
		GSC.notifications.create(NOTIFICATION_UPDATE_CHECK_FAILED, {
			message: 'Failed to check extensions updates: ' + cause,
			buttons: [
				{title: 'Retry'},
				{title: 'Close'}
			],
		});
	}

	function init() {
		chrome.alarms.onAlarm.addListener(function (alarm) {
			if (alarm.name === ALARM_UPDATE_CHECK)
			{
				check();
			}
		});

		chrome.notifications.onClosed.addListener(function (notificationId, byUser) {
			if (!byUser)
			{
				GSC.notifications.update(notificationId);
			}
			else
			{
				GSC.notifications.remove(notificationId);
			}
		});

		chrome.notifications.onClicked.addListener(function (notificationId) {
			if (notificationId === NOTIFICATION_UPDATE_AVAILABLE)
			{
				chrome.tabs.create({
					url: 'https://extensions.gnome.org/local/',
					active: true
				});
			}

			GSC.notifications.remove(notificationId);
		});

		chrome.notifications.onButtonClicked.addListener(function (notificationId, buttonIndex) {
			if ($.inArray(notificationId, [NOTIFICATION_UPDATE_AVAILABLE, NOTIFICATION_UPDATE_CHECK_FAILED]) === -1)
				return;

			if (notificationId === NOTIFICATION_UPDATE_CHECK_FAILED && buttonIndex === 0)
			{
				check();
			}

			GSC.notifications.remove(notificationId);
		});

		chrome.storage.onChanged.addListener(function (changes, areaName) {
			if (changes.updateCheck)
			{
				if (!changes.updateCheck.newValue)
				{
					chrome.alarms.clear(ALARM_UPDATE_CHECK);
				}
				else
				{
					chrome.storage.sync.get(DEFAULT_OPTIONS, function (options) {
						schedule(options.updateCheckPeriod);
					});
				}
			}
			else if (changes.updateCheckPeriod)
			{
				chrome.storage.sync.get(DEFAULT_OPTIONS, function (options) {
					if (options.updateCheck)
					{
						schedule(options.updateCheckPeriod);
					}
				});
			}
		});

		chrome.storage.sync.get(DEFAULT_OPTIONS, function (options) {
			if (options.updateCheck)
			{
				chrome.alarms.get(ALARM_UPDATE_CHECK, function (alarm) {
					if (!alarm || !alarm.periodInMinutes || alarm.periodInMinutes !== options.updateCheckPeriod * 60)
					{
						schedule(options.updateCheckPeriod);
					}
				});
			}
		});
	}

	return {
		init: init,
		check: check,
		schedule: schedule
	};
})(jQuery);
