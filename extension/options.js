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
