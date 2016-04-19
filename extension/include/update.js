/*
    GNOME Shell integration for Chrome
    Copyright (C) 2016  Yuri Konotopov <ykonotopov@gmail.com>

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.
 */

GSC.update = (function($) {
	function schedule(updateCheckPeriod, skipCheck) {
		if(!skipCheck)
		{
			check();
		}

		chrome.alarms.create(
			ALARM_UPDATE_CHECK,
			{
				delayInMinutes: updateCheckPeriod * 60,
				periodInMinutes: updateCheckPeriod * 60
			}
		);

		chrome.runtime.sendMessage(GS_CHROME_ID, MESSAGE_NEXT_UPDATE_CHANGED);
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

						chrome.permissions.contains({
							permissions: ["webRequest"]
						}, function(webRequestEnabled) {
							if(webRequestEnabled)
							{
								chrome.webRequest.onErrorOccurred.addListener(
									onNetworkError,
									{
										urls: [ UPDATE_URL + "*" ],
										types: [ 'xmlhttprequest' ]
									}
								);
							}

							$.ajax({
								url: UPDATE_URL,
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
											message: m('extension_status_' + data[uuid])
										});
									}
								}

								if (toUpgrade.length > 0)
								{
									GSC.notifications.create(NOTIFICATION_UPDATE_AVAILABLE, {
										type: chrome.notifications.TemplateType.LIST,
										title: m('update_available'),
										message: '',
										items: toUpgrade
									});
								}

								chrome.storage.local.set({
									lastUpdateCheck: new Date().toLocaleString()
								});
							}).fail(function (jqXHR, textStatus, errorThrown) {
								if(textStatus === 'error' && !errorThrown)
								{
									if(webRequestEnabled)
									{
										return;
									}

									textStatus = m('network_error');
								}

								createUpdateFailedNotification(textStatus);
							}).always(function() {
								if(webRequestEnabled)
								{
									chrome.webRequest.onErrorOccurred.removeListener(onNetworkError);
								}
							});
						});
					}
					else
					{
						createUpdateFailedNotification(response.message ? response.message : m('native_request_failed', 'listExtensions'));
					}
				});
			}
			else
			{
				createUpdateFailedNotification(response.message ? response.message : m('native_request_failed', 'initialize'));
			}
		});
	}

	function createUpdateFailedNotification(cause) {
		GSC.notifications.create(NOTIFICATION_UPDATE_CHECK_FAILED, {
			message: m('update_check_failed', cause),
			buttons: [
				{title: m('retry')},
				{title: m('close')}
			]
		});
	}

	function onNetworkError(details) {
		createUpdateFailedNotification(details.error);
	}

	function init() {
		chrome.alarms.onAlarm.addListener(function (alarm) {
			if (alarm.name === ALARM_UPDATE_CHECK)
			{
				check();

				chrome.alarms.get(ALARM_UPDATE_CHECK, function (alarm) {
					if (alarm && alarm.periodInMinutes && ((alarm.scheduledTime - Date.now()) / 1000 / 60 < alarm.periodInMinutes * 0.9))
					{
						schedule(alarm.periodInMinutes / 60, true);
					}
					else
					{
						chrome.runtime.sendMessage(GS_CHROME_ID, MESSAGE_NEXT_UPDATE_CHANGED);
					}
				});
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
