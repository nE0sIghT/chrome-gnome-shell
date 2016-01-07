cmake_minimum_required (VERSION 3.2)
project (GS_Chrome)

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

find_package(PythonInterp 2.7 REQUIRED)
find_python_module(gi.repository.GLib REQUIRED)
find_python_module(gi.repository.Gio REQUIRED)

add_custom_target(extension
	COMMAND ${CMAKE_COMMAND} -E tar "cfv" "${CMAKE_BINARY_DIR}/extension.zip" --format=zip "*"
	WORKING_DIRECTORY "${CMAKE_CURRENT_SOURCE_DIR}/extension/")
