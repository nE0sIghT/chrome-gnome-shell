// Saves options to chrome.storage.sync.
function save_options() {
	var updateCheck = document.querySelector('#update_check_yes').checked;
	var updateCheckPeriod = document.querySelector('#update_check_period').value;
	updateCheckPeriod = Math.max(3, updateCheckPeriod);

	chrome.storage.sync.set({
		updateCheck:		updateCheck,
		updateCheckPeriod:	updateCheckPeriod
	}, function () {
		// Update status to let user know options were saved.
		var status = document.getElementById('status');

		status.textContent = 'Options saved.';
		setTimeout(function () {
			status.textContent = '';
		}, 750);
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

		document.querySelector('#update_check_period').value = items.updateCheckPeriod;
	});
}

function checkUpdate(result)
{
	if(result)
		document.querySelector('#update_check_yes').checked = true;
	else
		document.querySelector('#update_check_no').checked = true;
}

document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click',
	save_options);
