/*
    Gnome-shell integration for Chrome
    Copyright (C) 2016  Yuri Konotopov <ykonotopov@gmail.com>

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.
 */

function save_options()
{
	var showReleaseNotes = $('#show_release_notes_yes').prop('checked');
	var updateCheck = $('#update_check_yes').prop('checked');
	var updateCheckPeriod = $('#update_check_period').val();
	updateCheckPeriod = Math.max(3, updateCheckPeriod);

	chrome.storage.sync.set({
		showReleaseNotes:	showReleaseNotes,
		updateCheck:		updateCheck,
		updateCheckPeriod:	updateCheckPeriod
	}, function () {
		// Update status to let user know options were saved.
		$('#status')
			.show()
			.delay(750)
			.hide(250);
	});
}

function restore_options()
{
	chrome.storage.sync.get(DEFAULT_OPTIONS, function (items) {
		setCheckUpdate(items.updateCheck);
		$('#update_check_period').val(items.updateCheckPeriod);
		setReleaseNotes(items.showReleaseNotes);

		retrieveUpdateTimes();
	});
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

i18n();

document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click', save_options);

chrome.storage.onChanged.addListener(function (changes, areaName) {
	if (areaName === 'local' && changes.lastUpdateCheck)
	{
		if (changes.lastUpdateCheck.newValue)
		{
			$('#last_update_check').text(changes.lastUpdateCheck.newValue);
		}
	}
});

chrome.runtime.onMessage.addListener(
	function (request, sender, sendResponse) {
		if(
			sender.id && sender.id === GS_CHROME_ID &&
			request && request === MESSAGE_NEXT_UPDATE_CHANGED
		)
		{
			retrieveNextUpdateTime();
		}
	}
);
