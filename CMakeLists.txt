# GNOME Shell integration for Chrome build script

cmake_minimum_required (VERSION 2.8)
project (chrome-gnome-shell NONE)

# Suppress warning
if(NOT DEFINED(CMAKE_SIZEOF_VOID_P))
	set(CMAKE_SIZEOF_VOID_P 8)
endif(NOT DEFINED(CMAKE_SIZEOF_VOID_P))

# Variables
set(PROJECT_VERSION "6.1")

set(ARCHIVE_NAME ${CMAKE_PROJECT_NAME}-${PROJECT_VERSION})
set(ARCHIVE_FULL_NAME ${ARCHIVE_NAME}.tar.xz)
set(ARCHIVE_DEB_NAME ${CMAKE_PROJECT_NAME}_${PROJECT_VERSION}.orig.tar.xz)
set(DEB_DIR ${CMAKE_CURRENT_BINARY_DIR}/deb)

# Options
option(BUILD_EXTENSION		"Build extension zip package"	TRUE)
option(BUILD_CONNECTOR		"Build native messaging host"	TRUE)
option(BUILD_SOURCE_PACKAGE	"Build source package"		FALSE)
option(BUILD_DEB		"Build debian package"		FALSE)
option(BUILD_MESSAGES		"Update translation strings"	FALSE)

# Default extensions id for Chrome web store
if(NOT DEFINED(EXTENSION_ID))
	set(EXTENSION_ID "gphhapmejobijbbhgpjhcjognlahblep")
endif(NOT DEFINED(EXTENSION_ID))

# Debian variables
if(NOT DEFINED(DEBIAN_VERSION))
	set(DEBIAN_VERSION "0ubuntu1")
endif(NOT DEFINED(DEBIAN_VERSION))

if(NOT DEFINED(DEBIAN_DISTRO))
	set(DEBIAN_DISTRO "trusty")
endif(NOT DEFINED(DEBIAN_DISTRO))

macro(find_program_ex program message_type)
	string(TOUPPER ${program} _PROGRAM_UPPER)

	find_program(${_PROGRAM_UPPER}_EXECUTABLE ${program})

	if(${_PROGRAM_UPPER}_EXECUTABLE)
		message(STATUS "Found ${program}: ${${_PROGRAM_UPPER}_EXECUTABLE}")
		set(${_PROGRAM_UPPER}_FOUND TRUE)
	else(${_PROGRAM_UPPER}_EXECUTABLE)
		message(${message_type} "Could NOT find ${program}.")
	endif(${_PROGRAM_UPPER}_EXECUTABLE)
endmacro(find_program_ex)

include(GNUInstallDirs)

# Options validating
if(NOT BUILD_EXTENSION AND NOT BUILD_CONNECTOR AND NOT BUILD_MESSAGES)
	message(FATAL_ERROR "No build options selected")
endif(NOT BUILD_EXTENSION AND NOT BUILD_CONNECTOR AND NOT BUILD_MESSAGES)

if(BUILD_DEB AND NOT BUILD_SOURCE_PACKAGE)
	message(STATUS "Building of debian package enabled. Turning on building source package.")
	set(BUILD_SOURCE_PACKAGE TRUE)
endif(BUILD_DEB AND NOT BUILD_SOURCE_PACKAGE)

if(BUILD_SOURCE_PACKAGE AND NOT EXISTS ${CMAKE_CURRENT_SOURCE_DIR}/.git/)
	message(FATAL_ERROR "Unable to build source package outside of git repository.")
endif(BUILD_SOURCE_PACKAGE AND NOT EXISTS ${CMAKE_CURRENT_SOURCE_DIR}/.git/)

if(BUILD_MESSAGES AND NOT DEFINED GETTEXT_REPORT_EMAIL)
	message(FATAL_ERROR "GETTEXT_REPORT_EMAIL must be specified to generate po template.")
endif(BUILD_MESSAGES AND NOT DEFINED GETTEXT_REPORT_EMAIL)

# Options handling
if(BUILD_EXTENSION)
	find_program_ex(7z FATAL_ERROR)

	add_custom_target(extension ALL
		COMMAND "${7Z_EXECUTABLE}" a -tzip "${CMAKE_BINARY_DIR}/extension.zip" ./
		WORKING_DIRECTORY "${CMAKE_CURRENT_SOURCE_DIR}/extension/")
endif(BUILD_EXTENSION)

if(BUILD_CONNECTOR)
	configure_file("${CMAKE_CURRENT_SOURCE_DIR}/connector/io.github.ne0sight.gs_chrome_connector.json"
			"${CMAKE_BINARY_DIR}/")

	install(PROGRAMS "${CMAKE_CURRENT_SOURCE_DIR}/connector/gs-chrome-connector.py" DESTINATION "${CMAKE_INSTALL_BINDIR}/" RENAME gs-chrome-connector)
	install(FILES "${CMAKE_BINARY_DIR}/io.github.ne0sight.gs_chrome_connector.json" DESTINATION "/etc/chromium/native-messaging-hosts/")
	install(FILES "${CMAKE_BINARY_DIR}/io.github.ne0sight.gs_chrome_connector.json" DESTINATION "/etc/opt/chrome/native-messaging-hosts/")
	install(FILES "${CMAKE_CURRENT_SOURCE_DIR}/connector/external_extension.json" DESTINATION "/usr/share/google-chrome/extensions/" RENAME "${EXTENSION_ID}.json")
	install(FILES "${CMAKE_CURRENT_SOURCE_DIR}/connector/external_extension.json" DESTINATION "/usr/share/chromium/extensions/" RENAME "${EXTENSION_ID}.json")
endif(BUILD_CONNECTOR)

if(BUILD_SOURCE_PACKAGE)
	set(MESSAGE_NO_DIST "Unable to generate dist target. Dependencies missing.")

	find_program_ex(xz WARNING)
	find_package(Git)

	if(GIT_FOUND AND XZ_FOUND)
		# http://agateau.com/2009/cmake-and-make-dist-the-simple-version/
		add_custom_target(dist
			COMMAND ${GIT_EXECUTABLE} archive --prefix=${ARCHIVE_NAME}/ HEAD | ${XZ_EXECUTABLE} -z > ${CMAKE_BINARY_DIR}/${ARCHIVE_FULL_NAME}
			WORKING_DIRECTORY ${CMAKE_SOURCE_DIR})
	else(GIT_FOUND AND XZ_FOUND)
		if(BUILD_DEB)
			message(FATAL_ERROR ${MESSAGE_NO_DIST})
		else(BUILD_DEB)
			message(WARNING ${MESSAGE_NO_DIST})
		endif(BUILD_DEB)
	endif(GIT_FOUND AND XZ_FOUND)

	if(BUILD_DEB)
		find_program_ex(debuild FATAL_ERROR)
		find_program_ex(tar FATAL_ERROR)

		if(GPG_KEY)
			message(STATUS "Using GPG key ${GPG_KEY}")
			set(DEBUILD_KEY "-k${GPG_KEY}")
		else(GPG_KEY)
			message(STATUS "GPG_KEY not set. Using default GPG key")
		endif(GPG_KEY)

		configure_file("${CMAKE_CURRENT_SOURCE_DIR}/contrib/ubuntu/changelog"
				"${CMAKE_BINARY_DIR}/debian_changelog")

		add_custom_target(deb_prepare
			DEPENDS dist
			COMMAND ${CMAKE_COMMAND} -E make_directory "${DEB_DIR}/${ARCHIVE_NAME}"
			COMMAND ${CMAKE_COMMAND} -E copy "${CMAKE_CURRENT_BINARY_DIR}/${ARCHIVE_FULL_NAME}" "${DEB_DIR}/${ARCHIVE_DEB_NAME}"
			COMMAND ${TAR_EXECUTABLE} -xvf "${DEB_DIR}/${ARCHIVE_DEB_NAME}" -C "${DEB_DIR}/${ARCHIVE_NAME}" --strip-components=1)

		add_custom_target(deb ALL
			DEPENDS deb_prepare
			COMMAND ${CMAKE_COMMAND} -E copy_directory "${CMAKE_CURRENT_SOURCE_DIR}/contrib/ubuntu" "${DEB_DIR}/${ARCHIVE_NAME}/debian"
			COMMAND ${CMAKE_COMMAND} -E copy "${CMAKE_BINARY_DIR}/debian_changelog" "${DEB_DIR}/${ARCHIVE_NAME}/debian/changelog"
			COMMAND ${DEBUILD_EXECUTABLE} -S ${DEBUILD_KEY}
			WORKING_DIRECTORY ${DEB_DIR}/${ARCHIVE_NAME})
	endif(BUILD_DEB)
endif(BUILD_SOURCE_PACKAGE)

if(BUILD_MESSAGES)
	find_package(Gettext)
	if(NOT GETTEXT_FOUND)
		message(FATAL_ERROR "Gettext not found")
	endif(NOT GETTEXT_FOUND)

	add_custom_target(generate-pot
		COMMAND ${CMAKE_CURRENT_SOURCE_DIR}/contrib/chrome-messages2po.py
			--email ${GETTEXT_REPORT_EMAIL}
			--reference-lang en
			--write-pot
			${CMAKE_CURRENT_SOURCE_DIR}/contrib/chrome-web-store/
			${CMAKE_CURRENT_SOURCE_DIR}/extension/_locales/
			${CMAKE_CURRENT_SOURCE_DIR}/po/)

	add_custom_target(update-po
		DEPENDS generate-pot)

	file(GLOB PO_FILES
		LIST_DIRECTORIES false
		RELATIVE ${CMAKE_CURRENT_SOURCE_DIR}/po/
		${CMAKE_CURRENT_SOURCE_DIR}/po/*.po)

	foreach(PO ${PO_FILES})
		add_custom_command(TARGET update-po
			COMMENT "Updating ${PO}"
			WORKING_DIRECTORY ${CMAKE_CURRENT_SOURCE_DIR}/po
			COMMAND ${GETTEXT_MSGMERGE_EXECUTABLE} -q --update
				${PO}
				${CMAKE_CURRENT_SOURCE_DIR}/po/template.pot)
	endforeach()

	add_custom_command(TARGET update-po
		COMMAND ${CMAKE_COMMAND} -E remove ${CMAKE_CURRENT_SOURCE_DIR}/po/*.po~)

	add_custom_target(build-messages ALL
		DEPENDS update-po
		COMMAND ${CMAKE_CURRENT_SOURCE_DIR}/contrib/po2chrome-messages.py
			--reference-lang en
			${CMAKE_CURRENT_SOURCE_DIR}/contrib/chrome-web-store/
			${CMAKE_CURRENT_SOURCE_DIR}/extension/_locales/
			${CMAKE_CURRENT_SOURCE_DIR}/po/)
endif(BUILD_MESSAGES)
