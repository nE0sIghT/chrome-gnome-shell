cmake_minimum_required (VERSION 2.8)
project (GS_Chrome NONE)

option(BUILD_EXTENSION	"Build extension zip package"	TRUE)
option(BUILD_CONNECTOR	"Build native messaging host"	TRUE)

# Suppress warning
if(NOT DEFINED(CMAKE_SIZEOF_VOID_P))
	set(CMAKE_SIZEOF_VOID_P 8)
endif(NOT DEFINED(CMAKE_SIZEOF_VOID_P))

include(GNUInstallDirs)

# https://cmake.org/pipermail/cmake/2011-January/041666.html
function(find_python_module module)
	string(TOUPPER ${module} module_upper)
	if(NOT PY_${module_upper})
		if(ARGC GREATER 1 AND ARGV1 STREQUAL "REQUIRED")
			set(PY_${module}_FIND_REQUIRED TRUE)
		endif()
		# A module's location is usually a directory, but for binary modules
		# it's a .so file.
		execute_process(COMMAND "${PYTHON_EXECUTABLE}" "-c"
			"import re, ${module}; print re.compile('/__init__.py.*').sub('',${module}.__file__)"
			RESULT_VARIABLE _${module}_status
			OUTPUT_VARIABLE _${module}_location
			ERROR_QUIET OUTPUT_STRIP_TRAILING_WHITESPACE)

		if(NOT _${module}_status)
			set(PY_${module_upper} ${_${module}_location} CACHE STRING 
				"Location of Python module ${module}")
		endif(NOT _${module}_status)
	endif(NOT PY_${module_upper})

	include(FindPackageHandleStandardArgs)
	find_package_handle_standard_args(PY_${module} DEFAULT_MSG PY_${module_upper})
endfunction(find_python_module)

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
	find_package(PythonInterp 2.7 REQUIRED)
	find_python_module(gi.repository.GLib REQUIRED)
	find_python_module(gi.repository.Gio REQUIRED)

	configure_file("${CMAKE_CURRENT_SOURCE_DIR}/connector/io.github.ne0sight.gs_chrome_connector.json"
			"${CMAKE_BINARY_DIR}/")

	install(PROGRAMS "${CMAKE_CURRENT_SOURCE_DIR}/connector/gs-chrome-connector.py" DESTINATION "${CMAKE_INSTALL_BINDIR}/" RENAME gs-chrome-connector)
	install(FILES "${CMAKE_BINARY_DIR}/io.github.ne0sight.gs_chrome_connector.json" DESTINATION "/etc/chromium/native-messaging-hosts/")
	install(FILES "${CMAKE_BINARY_DIR}/io.github.ne0sight.gs_chrome_connector.json" DESTINATION "/etc/opt/chrome/native-messaging-hosts/")
endif(BUILD_CONNECTOR)
