/*
    Gnome-shell integration for Chrome
    Copyright (C) 2015  Yuri Konotopov <ykonotopov@gmail.com>

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.
 */

var s = document.createElement('script');

s.src = chrome.extension.getURL('gs-page-end.js');
s.onload = function() {
    this.parentNode.removeChild(this);
};
(document.head || document.documentElement).appendChild(s);

chrome.runtime.onMessage.addListener(
	function (request, sender, sendResponse) {
		if(
			sender.id && sender.id === 'gphhapmejobijbbhgpjhcjognlahblep' &&
			request && request.signal && request.signal === 'ExtensionStatusChanged')
		{
			window.postMessage(
				{
					type: "gs-chrome-event",
					request: request
				}, "*"
			);
		}
	}
);
