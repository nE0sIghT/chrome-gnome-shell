cmake_minimum_required (VERSION 2.8)
project (chrome-gnome-shell NONE)

set(PROJECT_VERSION "5.1")

set(ARCHIVE_NAME ${CMAKE_PROJECT_NAME}-${PROJECT_VERSION})
set(ARCHIVE_FULL_NAME ${ARCHIVE_NAME}.tar.xz)

option(BUILD_EXTENSION	"Build extension zip package"	TRUE)
option(BUILD_CONNECTOR	"Build native messaging host"	TRUE)

if(NOT DEFINED(EXTENSION_ID))
	set(EXTENSION_ID "gphhapmejobijbbhgpjhcjognlahblep")
endif(NOT DEFINED(EXTENSION_ID))

# Suppress warning
if(NOT DEFINED(CMAKE_SIZEOF_VOID_P))
	set(CMAKE_SIZEOF_VOID_P 8)
endif(NOT DEFINED(CMAKE_SIZEOF_VOID_P))

include(GNUInstallDirs)

if(NOT BUILD_EXTENSION AND NOT BUILD_CONNECTOR)
	message(FATAL_ERROR "No build options selected")
endif(NOT BUILD_EXTENSION AND NOT BUILD_CONNECTOR)

if(BUILD_EXTENSION)
	find_program(7ZIP 7z)
	if(NOT 7ZIP)
		message(FATAL_ERROR "7-zip not found.")
	endif(NOT 7ZIP)

	add_custom_target(extension ALL
		COMMAND "${7ZIP}" a -tzip "${CMAKE_BINARY_DIR}/extension.zip" ./
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

find_program(XZ xz)
if(XZ)
	# http://agateau.com/2009/cmake-and-make-dist-the-simple-version/
	add_custom_target(dist
		COMMAND git archive --prefix=${ARCHIVE_NAME}/ HEAD | xz -z > ${CMAKE_BINARY_DIR}/${ARCHIVE_FULL_NAME}
		WORKING_DIRECTORY ${CMAKE_SOURCE_DIR})
else(XZ)
	message(WARNING "XZ utils not found. Dist target will not be generated.")
endif(XZ)
