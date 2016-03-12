cmake_minimum_required (VERSION 2.8)
project (chrome-gnome-shell NONE)

set(PROJECT_VERSION "5.1")

set(ARCHIVE_NAME ${CMAKE_PROJECT_NAME}-${PROJECT_VERSION})
set(ARCHIVE_FULL_NAME ${ARCHIVE_NAME}.tar.xz)
set(ARCHIVE_DEB_NAME ${CMAKE_PROJECT_NAME}_${PROJECT_VERSION}.orig.tar.xz)
set(DEB_DIR ${CMAKE_CURRENT_BINARY_DIR}/deb)

option(BUILD_EXTENSION	"Build extension zip package"	TRUE)
option(BUILD_CONNECTOR	"Build native messaging host"	TRUE)
option(BUILD_DEB	"Build debian package"		FALSE)

if(NOT DEFINED(EXTENSION_ID))
	set(EXTENSION_ID "gphhapmejobijbbhgpjhcjognlahblep")
endif(NOT DEFINED(EXTENSION_ID))

if(NOT DEFINED(DEBIAN_VERSION))
	set(DEBIAN_VERSION "0ubuntu1")
endif(NOT DEFINED(DEBIAN_VERSION))

if(NOT DEFINED(DEBIAN_DISTRO))
	set(DEBIAN_DISTRO "trusty")
endif(NOT DEFINED(DEBIAN_DISTRO))

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
		COMMAND git archive --prefix=${ARCHIVE_NAME}/ HEAD | ${XZ} -z > ${CMAKE_BINARY_DIR}/${ARCHIVE_FULL_NAME}
		WORKING_DIRECTORY ${CMAKE_SOURCE_DIR})
else(XZ)
	if(BUILD_DEB)
		message(FATAL_ERROR "XZ utils not found.")
	else(BUILD_DEB)
		message(WARNING "XZ utils not found. Dist target will not be generated.")
	endif(BUILD_DEB)
endif(XZ)

if(BUILD_DEB)
	find_program(DEBUILD debuild)
	find_program(TAR tar)

	if(NOT DEBUILD)
		message(FATAL_ERROR "Debuild not found.")
	endif(NOT DEBUILD)

	if(NOT TAR)
		message(FATAL_ERROR "Tar not found.")
	endif(NOT TAR)

	if(GPG_KEY)
		set(DEBUILD_KEY "-k${GPG_KEY}")
	endif(GPG_KEY)

	configure_file("${CMAKE_CURRENT_SOURCE_DIR}/contrib/ubuntu/changelog"
			"${CMAKE_BINARY_DIR}/debian_changelog")

	add_custom_target(deb_prepare
		DEPENDS dist
		COMMAND ${CMAKE_COMMAND} -E make_directory "${DEB_DIR}/${ARCHIVE_NAME}"
		COMMAND ${CMAKE_COMMAND} -E copy "${CMAKE_CURRENT_BINARY_DIR}/${ARCHIVE_FULL_NAME}" "${DEB_DIR}/${ARCHIVE_DEB_NAME}"
		COMMAND ${TAR} -xvf "${DEB_DIR}/${ARCHIVE_DEB_NAME}" -C "${DEB_DIR}/${ARCHIVE_NAME}" --strip-components=1)

	add_custom_target(deb ALL
		DEPENDS deb_prepare
		COMMAND ${CMAKE_COMMAND} -E copy_directory "${CMAKE_CURRENT_SOURCE_DIR}/contrib/ubuntu" "${DEB_DIR}/${ARCHIVE_NAME}/debian"
		COMMAND ${CMAKE_COMMAND} -E copy "${CMAKE_BINARY_DIR}/debian_changelog" "${DEB_DIR}/${ARCHIVE_NAME}/debian/changelog"
		COMMAND ${DEBUILD} -S ${DEBUILD_KEY}
		WORKING_DIRECTORY ${DEB_DIR}/${ARCHIVE_NAME})
endif(BUILD_DEB)
