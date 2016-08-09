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

IS_OPERA				= navigator.userAgent.indexOf(' OPR/') >= 0;

NOTIFICATION_UPDATE_AVAILABLE		= 'gs-chrome-update';
NOTIFICATION_UPDATE_CHECK_FAILED	= 'gs-chrome-update-fail';
ALARM_UPDATE_CHECK			= 'gs-chrome-update-check';

MESSAGE_NEXT_UPDATE_CHANGED		= 'gs-next-update-changed';

NATIVE_HOST				= 'io.github.ne0sight.gs_chrome_connector';

EXTENSIONS_WEBSITE			= 'https://extensions.gnome.org/';
UPDATE_URL				= EXTENSIONS_WEBSITE + 'update-info/';

DEFAULT_SYNC_OPTIONS			= {
	showReleaseNotes:	true,
	updateCheck:		true,
	updateCheckPeriod:	6
};

EXTERNAL_MESSAGES = [
	"connecting_host_app",
	"error_extension_response",
	"no_host_connector",
	"older_connector",
	"version",
	"warning_versions_mismatch"
];
