#!/usr/bin/env python2

'''
    Gnome-shell integration for Chrome
    Copyright (C) 2016  Yuri Konotopov <ykonotopov@gmail.com>

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.
'''

from gi.repository import GLib, Gio
import json
import struct
import sys
import threading

SHELL_SCHEMA		= "org.gnome.shell"
ENABLED_EXTENSIONS_KEY	= "enabled-extensions"
EXTENSION_DISABLE_VERSION_CHECK_KEY = "disable-extension-version-validation"

# On Windows, the default I/O mode is O_TEXT. Set this to O_BINARY
# to avoid unwanted modifications of the input/output streams.
if sys.platform == "win32":
	import os, msvcrt
	msvcrt.setmode(sys.stdin.fileno(), os.O_BINARY)
	msvcrt.setmode(sys.stdout.fileno(), os.O_BINARY)

# Helper function that sends a message to the webapp.
def send_message(response):
	message = json.dumps(response)

	# Write message size.
	sys.stdout.write(struct.pack('I', len(message)))
	# Write the message itself.
	sys.stdout.write(message)
	sys.stdout.flush()

def send_error(message):
	send_message({'success': False, 'message': message})

def dbus_call_response(method, parameters, resultProperty):
	result = proxy.call_sync(method,
		parameters,
		Gio.DBusCallFlags.NONE,
		-1,
		None)

	send_message({ 'success': True, resultProperty: result.unpack()[0] })

# Thread that reads messages from the webapp.
def read_thread_func(proxy, mainLoop):
	settings = Gio.Settings.new(SHELL_SCHEMA)

	while 1:
		# Read the message length (first 4 bytes).
		text_length_bytes = sys.stdin.read(4)

		if len(text_length_bytes) == 0:
			mainLoop.quit()
			break

		# Unpack message length as 4 byte integer.
		text_length = struct.unpack('i', text_length_bytes)[0]

		# Read the text (JSON object) of the message.
		text = sys.stdin.read(text_length).decode('utf-8')

		request = json.loads(text)

		if 'execute' in request:
			if request['execute'] == 'initialize':
				shellVersion = proxy.get_cached_property("ShellVersion")
				disableVersionCheck = settings.get_boolean(EXTENSION_DISABLE_VERSION_CHECK_KEY)

				send_message(
					{
						'success': True,
						'properties': {
							'shellVersion': shellVersion.unpack(),
							'versionValidationEnabled': not disableVersionCheck
						}
					}
				)

			elif request['execute'] == 'installExtension':
				dbus_call_response("InstallRemoteExtension", GLib.Variant.new_tuple(GLib.Variant.new_string(request['uuid'])), "status")

			elif request['execute'] == 'listExtensions':
				dbus_call_response("ListExtensions", None, "extensions")

			elif request['execute'] == 'EnableExtension':
				uuid = request['uuid']
				enable = request['enable']

				uuids = settings.get_strv(ENABLED_EXTENSIONS_KEY)

				if enable:
					uuids.append(uuid)
				else:
					uuids.remove(uuid)

				settings.set_strv(ENABLED_EXTENSIONS_KEY, uuids)

				send_message({ 'success': True })

			elif request['execute'] == 'launchExtensionPrefs':
				proxy.call("LaunchExtensionPrefs",
						GLib.Variant.new_tuple(GLib.Variant.new_string(request['uuid'])),
						Gio.DBusCallFlags.NONE,
						-1,
						None,
						None,
						None)

			elif request['execute'] == 'getExtensionErrors':
				dbus_call_response("GetExtensionErrors", GLib.Variant.new_tuple(GLib.Variant.new_string(request['uuid'])), "extensionErrors")

			elif request['execute'] == 'getExtensionInfo':
				dbus_call_response("GetExtensionInfo", GLib.Variant.new_tuple(GLib.Variant.new_string(request['uuid'])), "extensionInfo")

def on_shell_signal(d_bus_proxy, sender_name, signal_name, parameters):
	if signal_name == 'ExtensionStatusChanged':
		send_message({ 'signal': signal_name, 'parameters': parameters.unpack() })

if __name__ == '__main__':
	proxy = Gio.DBusProxy.new_for_bus_sync(Gio.BusType.SESSION,
						Gio.DBusProxyFlags.NONE,
						None,
						'org.gnome.Shell',
						'/org/gnome/Shell',
						'org.gnome.Shell.Extensions',
						None)

	proxy.connect('g-signal', on_shell_signal)

	mainLoop = GLib.MainLoop()

	appLoop = threading.Thread(target=read_thread_func, args=(proxy, mainLoop))
	appLoop.start()

	mainLoop.run()
	appLoop.join()

	sys.exit(0)
