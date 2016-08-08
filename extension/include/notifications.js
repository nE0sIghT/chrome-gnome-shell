/*
    GNOME Shell integration for Chrome
    Copyright (C) 2016  Yuri Konotopov <ykonotopov@gmail.com>

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.
 */

GSC.notifications = (function($) {
	var browser = (function() {
		function init() {
			chrome.runtime.onStartup.addListener(function() {
				// Do nothing. We just need this callback to restore notifications
			});

			chrome.notifications.onClosed.addListener(function (notificationId, byUser) {
				if (!byUser)
				{
					update(notificationId);
				}
				else
				{
					remove(notificationId);
				}
			});

			chrome.notifications.onClicked.addListener(function (notificationId) {
				GSC.notifications.remove(notificationId);
			});

			restore();
		}

		function create(name, options) {
			chrome.storage.local.get({
				notifications: {}
			}, function (items) {
				var notifications = items.notifications;

				notifications[name] = $.extend({
					type: chrome.notifications.TemplateType.BASIC,
					iconUrl: 'icons/GnomeLogo-128.png',
					title: 'GNOME Shell integration',
					buttons: [
						{title: m('close')}
					],
					priority: 2,
					isClickable: true
				}, options);

				_create(name, notifications[name], function (notificationId) {
					chrome.storage.local.set({
						notifications: notifications
					});

					update(notificationId);
				});
			});
		}

		function _create(name, options, callback)
		{
			if(IS_OPERA && options.buttons)
			{
				delete options.buttons;
				if(options.type === chrome.notifications.TemplateType.LIST)
				{
					var items = [];
					for(k in options.items)
					{
						if(options.items.hasOwnProperty(k))
						{
							items.push(options.items[k].title + ' ' + options.items[k].message);
						}
					}
					options.message += "\n" + items.join("\n");

					options.type = chrome.notifications.TemplateType.BASIC;
					delete options.items;
				}
			}

			if (callback)
			{
				chrome.notifications.create(name, options, callback);
			}
			else
			{
				chrome.notifications.create(name, options);
			}
		}

		function update(notificationId) {
			chrome.storage.local.get({
				notifications: {}
			}, function (items) {
				var notifications = items.notifications;

				if (notifications[notificationId])
				{
					_create(notificationId, notifications[notificationId]);
				}
			});
		}

		function remove(notificationId) {
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

		function restore() {
			chrome.storage.local.get({
				notifications: {}
			}, function (items) {
				var notifications = items.notifications;

				for (notificationId in notifications)
				{
					update(notificationId);
				}
			});
		}

		init();

		return {
			create: create,
			remove: remove
		};
	})();


	return {
		create: browser.create,
		remove: browser.remove
	};
})(jQuery);
