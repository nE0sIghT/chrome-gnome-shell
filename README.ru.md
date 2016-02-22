Интеграция GNOME Shell для Chrome
============================================

Язык
------------
[English](README.md)  
[Русский](README.ru.md)

Введение
------------

Этот репозиторий содержит расширение для обозревателя Google Chrome и нативную
программу-коннектор предоставляющие интеграцию с GNOME Shell и соответствующим
репозиторием расширений https://extensions.gnome.org/ под кодовым именем SweetTooth.

Установка
------------

Для работы с [репозиторием расширений GNOME Shell](https://extensions.gnome.org/) в обозревателе Google Chrome вы должны установить [расширение GNOME Shell integration](https://chrome.google.com/webstore/detail/gnome-shell-integration/gphhapmejobijbbhgpjhcjognlahblep) и нативную программу-коннектор.

Наиболее простой способ установки расширения и коннектора - с помощью менеджера пакетов вашего дистрибутива.

Для Gentoo Linux ebuild доступен в оверлее vortex. Если вы используете Layman просто наберите:
```
layman -a vortex
emerge -av gnome-extra/chrome-gnome-shell
```

PKGBUILD для Arch Linux доступен в AUR: [gs-chrome-connector](https://aur.archlinux.org/packages/gs-chrome-connector-git/).

Пакет для Ubuntu Linux доступен в PPA ne0sight/chrome-gnome-shell. Для его установки наберите:
```
sudo add-apt-repository ppa:ne0sight/chrome-gnome-shell
sudo apt-get update
sudo apt-get install chrome-gnome-shell
```

Если для вашего дистрибутива нет готового пакета вы можете установить расширение из [Интернет-магазина Chrome](https://chrome.google.com/webstore/detail/gnome-shell-integration/gphhapmejobijbbhgpjhcjognlahblep),
а нативную программу-коннектор с помощью cmake или вручную.

Ручная установка
------------

Для ручной установки первым делом сделайте копию этого репозитория или скачайте архив с последним релизом.

Исходные коды расширения располагаются в папке "extension". Информация по установке распакованного расширения доступна в [документации Google Chrome](https://developer.chrome.com/extensions/getstarted#unpacked).

Перед установкой нативной программы-коннектора убедитесь, что следующие пакеты установлены в вашей системе:
* Cmake 2.8+
* Python 2.7
* GNOME Shell

Все команды должны выполняться из корня копии репозитория.

**Для установки нативной программы-коннектора с помощью cmake**:

1. Создайте папку для сборки и перейдите в нее:  
`mkdir build && cd build`
2. Запустите cmake для создания make-файлов:  
`cmake -DCMAKE_INSTALL_PREFIX=/usr -DBUILD_EXTENSION=OFF ../`
3. Установите программу-коннектор:  
`make install`

**Вы также можете установить программу-коннектор без использования cmake**:

1. Скопируйте файл `connector/gs-chrome-connector.py` в любую папку (например, в /usr/local/bin).
2. Скопируйте файл `connector/io.github.ne0sight.gs_chrome_connector.json`:
  * для Google Chrome в `/etc/opt/chrome/native-messaging-hosts/`;
  * для Google Chromium и производных (Vivaldi и т.п.) в `/etc/chromium/native-messaging-hosts/`.
3. Отредактируйте скопированный файл `io.github.ne0sight.gs_chrome_connector.json` и замените `${CMAKE_INSTALL_FULL_BINDIR}/gs-chrome-connector` на полный путь к скопированному файлу `gs-chrome-connector.py`.

Правовое уведомление
------------

GNOME Shell integration for Chrome НЕ ЯВЛЯЕТСЯ официальным проектом GNOME Foundation.
Логотип GNOME и название GNOME являются зарегистрированными торговыми марками или торговыми марками GNOME Foundation в США или других странах.
