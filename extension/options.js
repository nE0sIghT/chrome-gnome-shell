/*
    GNOME Shell integration for Chrome
    Copyright (C) 2016  Yuri Konotopov <ykonotopov@gmail.com>

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.
 */

function save_options()
{
	var showReleaseNotes = $('#show_release_notes_yes').prop('checked');
	var syncExtensions = $('#synchronize_extensions_yes').prop('checked');
	var updateCheck = $('#update_check_yes').prop('checked');
	var updateCheckPeriod = $('#update_check_period').val();
	updateCheckPeriod = Math.max(3, updateCheckPeriod);

	chrome.storage.sync.set({
		showReleaseNotes:	showReleaseNotes,
		updateCheck:		updateCheck,
		updateCheckPeriod:	updateCheckPeriod
	}, function () {
		chrome.storage.local.set({
			syncExtensions:	syncExtensions
		}, function() {
			if(syncExtensions)
			{
				syncType = document.getElementById('syncChoice').returnValue;
				if(!syncType || syncType === 'local')
				{
					GSC.sync.getExtensions($.Deferred().done(function (extensions) {
						var localExtensions = {};
						$.each(extensions, function (uuid, extension) {
							if(
								extension.local &&
								$.inArray(extension.localState,
									[EXTENSION_STATE.ENABLED, EXTENSION_STATE.DISABLED]) !== -1
							)
							{
								localExtensions[extension.uuid] = {
									uuid:	extension.uuid,
									name:	extension.name,
									state:	extension.localState
								};
							}
						});

						chrome.storage.sync.set({
							extensions: localExtensions
						}, function() {
							showSuccessStatus();
						});
					}).fail(function (message) {
						$('#error')
							.text(message)
							.show()
							.delay(15000)
							.hide(250);
					}));
				}
				else if(syncType === 'remote')
				{
					chrome.runtime.sendMessage(GS_CHROME_ID, MESSAGE_SYNC_FROM_REMOTE);
					showSuccessStatus();
				}
			}
			else
			{
				showSuccessStatus();
			}
		});
	});
}

function showSuccessStatus()
{
	// Update status to let user know options were saved.
	$('#status')
		.show()
		.delay(750)
		.hide(250);
}

function restore_options()
{
	tabby.init();

	chrome.storage.sync.get(DEFAULT_SYNC_OPTIONS, function (items) {
		setCheckUpdate(items.updateCheck);
		$('#update_check_period').val(items.updateCheckPeriod);
		setReleaseNotes(items.showReleaseNotes);

		retrieveUpdateTimes();
	});

	chrome.permissions.contains({
		permissions: ["webRequest"]
	}, function(result) {
		setNetworkErrors(result);
	});

	if(!IS_OPERA)
	{
		updateSynchronizationStatus();
		chrome.storage.local.get(DEFAULT_LOCAL_OPTIONS, function (items) {
			setSyncExtensions(items.syncExtensions);
		});
	}
	else
	{
		$('a[data-i18n="synchronization"]').parent().remove();
		$('#synchronize_extensions_yes').closest('dl').hide();
	}
}

function retrieveUpdateTimes()
{
	chrome.storage.local.get({
		lastUpdateCheck: null
	}, function (items) {
		if(items.lastUpdateCheck)
		{
			$('#last_update_check').text(items.lastUpdateCheck);
		}
		else
		{
			$('#last_update_check').text(m('never'));
		}
	});

	retrieveNextUpdateTime();
}

function retrieveNextUpdateTime()
{
	chrome.alarms.get(ALARM_UPDATE_CHECK, function (alarm) {
		if (alarm)
		{
			$('#next_update_check').text(new Date(alarm.scheduledTime).toLocaleString());
		}
		else
		{
			$('#next_update_check').text(m('never'));
		}
	});
}

function setCheckUpdate(result)
{
	if(result)
		$('#update_check_yes').prop('checked', true);
	else
		$('#update_check_no').prop('checked', true);
}

function setReleaseNotes(result)
{
	if(result)
		$('#show_release_notes_yes').prop('checked', true);
	else
		$('#show_release_notes_no').prop('checked', true);
}

function setNetworkErrors(result)
{
	if(result)
		$('#show_network_errors_yes').prop('checked', true);
	else
		$('#show_network_errors_no').prop('checked', true);
}

function setSyncExtensions(result)
{
	if(result)
		$('#synchronize_extensions_yes').prop('checked', true);
	else
		$('#synchronize_extensions_no').prop('checked', true);
}

function handleWebrequestPermission()
{
	if($('#show_network_errors_yes').prop('checked'))
	{
		chrome.permissions.request({
			permissions: ["webRequest"]
		}, function(granted) {
			setNetworkErrors(granted);
		});
	}
	else
	{
		chrome.permissions.remove({
			permissions: ["webRequest"]
		}, function(removed) {
			setNetworkErrors(!removed);
		});
	}
}

function updateSynchronizationStatus()
{
	GSC.sync.getExtensions($.Deferred().done(function (extensions) {
		var keys = Object.keys(extensions).sort(function (a, b) {
			var nameA = extensions[a].name.toLowerCase();
			var nameB = extensions[b].name.toLowerCase();

			if (nameA < nameB)
			{
				return -1;
			}

			if (nameA > nameB)
			{
				return 1;
			}

			return 0;
		});

		$('#synchronization table tbody').empty();
		$.each(keys, function (key, uuid) {
			var extension = extensions[uuid];

			$('#synchronization table tbody').append(
				$('<tr />')
					.append(
						$('<td />').text(extension.name)
					)
					.append(
						$('<td />').addClass(
							extension.local ? 'ok' : 'fail'
						)
					)
					.append(
						$('<td />').addClass(
							extension.localState == EXTENSION_STATE.ENABLED ? 'ok' : 'fail'
						)
					)
					.append(
						$('<td />').addClass(
							extension.remote ? 'ok' : 'fail'
						)
					)
			);
		});
	}).fail(function (message) {
		$('#error')
			.text(message)
			.show()
			.delay(15000)
			.hide(250);
	}));
}

i18n();

document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click', save_options);
$.each(document.getElementsByName('show_network_errors'), function(index, control) {
	control.addEventListener('change', handleWebrequestPermission);
});

document.getElementById('syncChoice').addEventListener('close', function() {
	if(document.getElementById('syncChoice').returnValue === 'cancel')
	{
		$('#synchronize_extensions_no').prop('checked', 'checked');
	}
});
$('input[type="radio"][name="synchronize_extensions"]').change(function() {
	if($('#synchronize_extensions_yes').is(':checked'))
	{
		chrome.storage.sync.get({
			extensions: {}
		}, function (options) {
			if(!$.isEmptyObject(options.extensions))
			{
				document.getElementById('syncChoice').showModal();
			}
		});
	}
});

if($('#translation_credits div').is(':empty'))
{
	$('.translation_credits_container').remove();
}

chrome.storage.onChanged.addListener(function (changes, areaName) {
	if (areaName === 'local')
	{
		if(changes.lastUpdateCheck && changes.lastUpdateCheck.newValue)
		{
			$('#last_update_check').text(changes.lastUpdateCheck.newValue);
		}
	}

	if (areaName === 'sync' && changes.extensions)
	{
		updateSynchronizationStatus();
	}
});

chrome.runtime.onMessage.addListener(
	function (request, sender, sendResponse) {
		if(sender.id && sender.id === GS_CHROME_ID && request)
		{
			if(request === MESSAGE_NEXT_UPDATE_CHANGED)
			{
				retrieveNextUpdateTime();
			}
			else if(request.signal && request.signal === SIGNAL_EXTENSION_CHANGED)
			{
				updateSynchronizationStatus();
			}
		}
	}
);
