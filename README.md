GNOME Shell integration for Chrome
============================================

Language
------------
[English](README.md)  
[Русский](README.ru.md)

Introduction
------------

This repository contains extension for Google Chrome browser and native
connector that provides integration with GNOME Shell and the corresponding
extensions repository https://extensions.gnome.org/, codenamed SweetTooth.

Installation
------------

In order to work with [GNOME Shell extensions repository](https://extensions.gnome.org/) in Google Chrome browser you must install [GNOME Shell integration extension](https://chrome.google.com/webstore/detail/gnome-shell-integration/gphhapmejobijbbhgpjhcjognlahblep) and native connector.

The easiest way to install both is use your distro's favorite package manager.

For Gentoo Linux ebuild is available in vortex overlay. If you use Layman just type:
```
layman -a vortex
emerge -av gnome-extra/chrome-gnome-shell
```
For Arch Linux there is a PKGBUILD available in the AUR: [gs-chrome-connector](https://aur.archlinux.org/packages/gs-chrome-connector-git/).

If there is no package in your distro you can install extension via [Chrome web store](https://chrome.google.com/webstore/detail/gnome-shell-integration/gphhapmejobijbbhgpjhcjognlahblep)
and native connector using cmake or manually.

Manual installation
------------

For manual installation you must clone this repository first or download latest release tarball.

Web extension sources located in "extension" folder. Refer [Google Chrome documentation](https://developer.chrome.com/extensions/getstarted#unpacked) for instructions about installing unpacked extension.

Before installing native connector make sure following packages installed in your system:
* Cmake 2.8+
* Python 2.7
* GNOME Shell

All commands must be issued from the root of cloned repository.

**To install native connector with cmake** follow this steps:

1. Create build folder and go to it:  
`mkdir build && cd build`
2. Run cmake to create makefiles:  
`cmake -DCMAKE_INSTALL_PREFIX=/usr -DBUILD_EXTENSION=OFF ../`
3. Install connector:  
`make install`

**You also can install connector without cmake** following this steps:

1. Copy file `connector/gs-chrome-connector.py` to your preferred location.
2. Copy file `connector/io.github.ne0sight.gs_chrome_connector.json`:
  * for Google Chrome to `/etc/opt/chrome/native-messaging-hosts/`;
  * for Google Chromium and derivatives (Vivaldi etc) to `/etc/chromium/native-messaging-hosts/`.
3. Edit copied `io.github.ne0sight.gs_chrome_connector.json` file and replace `${CMAKE_INSTALL_FULL_BINDIR}/gs-chrome-connector` with full path to copied `gs-chrome-connector.py`.

Legal notice
------------

GNOME Shell integration for Chrome is NOT an official GNOME Foundation project.
The GNOME logo and GNOME name are registered trademarks or trademarks of GNOME Foundation in the United States or other countries.
