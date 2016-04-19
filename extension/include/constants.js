/*
    GNOME Shell integration for Chrome
    Copyright (C) 2016  Yuri Konotopov <ykonotopov@gmail.com>

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.
 */

GS_CHROME_ID				= chrome.i18n.getMessage('@@extension_id');
PLATFORMS_WHITELIST			= ["linux", "openbsd"];

NOTIFICATION_UPDATE_AVAILABLE		= 'gs-chrome-update';
NOTIFICATION_UPDATE_CHECK_FAILED	= 'gs-chrome-update-fail';
ALARM_UPDATE_CHECK			= 'gs-chrome-update-check';

MESSAGE_NEXT_UPDATE_CHANGED		= 'gs-next-update-changed';

NATIVE_HOST				= 'io.github.ne0sight.gs_chrome_connector';

UPDATE_URL				= 'https://extensions.gnome.org/update-info/';

DEFAULT_OPTIONS				= {
	showReleaseNotes:	true,
	updateCheck:		true,
	updateCheckPeriod:	6
};

EXTERNAL_MESSAGES = [
	"error_extension_response",
	"no_host_connector",
	"older_connector",
	"version",
	"warning_versions_mismatch"
];
