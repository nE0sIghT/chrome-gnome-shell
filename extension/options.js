/*
    Gnome-shell integration for Chrome
    Copyright (C) 2016  Yuri Konotopov <ykonotopov@gmail.com>

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.
 */

// Saves options to chrome.storage.sync.
function save_options() {
	var updateCheck = $('#update_check_yes').prop('checked');
	var updateCheckPeriod = $('#update_check_period').val();
	updateCheckPeriod = Math.max(3, updateCheckPeriod);

	chrome.storage.sync.set({
		updateCheck:		updateCheck,
		updateCheckPeriod:	updateCheckPeriod
	}, function () {
		// Update status to let user know options were saved.
		$('#status')
			.show()
			.delay(750)
			.hide(250);

		retrieveUpdateTimes();
	});
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {

	chrome.storage.sync.get({
		updateCheck:		true,
		updateCheckPeriod:	6
	}, function (items) {
		if(items.updateCheck)
		{
			checkUpdate(true);
		}
		else
		{
			checkUpdate(false);
		}

		$('#update_check_period').val(items.updateCheckPeriod);

		retrieveUpdateTimes();
	});
}

function retrieveUpdateTimes()
{
	var ALARM_UPDATE_CHECK			= 'gs-chrome-update-check';

	chrome.storage.local.get({
		lastUpdateCheck: null
	}, function (items) {
		if(items.lastUpdateCheck)
		{
			$('#last_update_check').text(items.lastUpdateCheck);
		}
		else
		{
			$('#last_update_check').text('never');
		}
	});

	chrome.alarms.get(ALARM_UPDATE_CHECK, function (alarm) {
		if (alarm)
		{
			$('#next_update_check').text(new Date(alarm.scheduledTime).toLocaleString());
		}
		else
		{
			$('#next_update_check').text('never');
		}
	});
}

function checkUpdate(result)
{
	if(result)
		$('#update_check_yes').prop('checked', true);
	else
		$('#update_check_no').prop('checked', true);
}

document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click',
	save_options);
