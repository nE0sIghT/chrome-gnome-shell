#!/usr/bin/env python

import os
import shutil
from distutils.core import setup

SCRIPT_DIR = os.path.dirname(os.path.realpath(__file__))
BUILD_DIR = SCRIPT_DIR + '/../build'
SCRIPT_PATH = BUILD_DIR + '/chrome-gnome-shell'

if not os.path.exists(BUILD_DIR):
    os.makedirs(BUILD_DIR)
shutil.copyfile(SCRIPT_DIR + '/chrome-gnome-shell.py', SCRIPT_PATH)

setup(name='chrome-gnome-shell',
      scripts=[SCRIPT_PATH]
     )
