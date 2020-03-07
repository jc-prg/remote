#!/usr/bin/python3
#----------------------------------------------
# create index for JS files ...
# v0.1.3
#----------------------------------------------

# load basic modules and configuration
#----------------------------------------------

import datetime
import os
import glob

#----------------------------------------------

js_dir             = "./"
js_overall_index   = "00-index-js.txt"
appVersion         = "\"not found\""

cache_manifest     = "cache.manifest"
cache_manifest_dir = [
	"./"
	]

text_to_replace = [
#	[ "appPrintMenu", "appPrint_menu" ], # sample
	[ "updateRemote","remoteUpdate" ],
	[ "toggleEditMode","remoteToggleEditMode" ],
	[ "lastRemoteCookie","remoteLastFromCookie" ],
	[ "initRemote","remoteInit" ],
	]


# create index for JS files
#----------------------------------------------

def get_cache_files():
    files = []
    for directory in cache_manifest_dir:
       files.extend(glob.glob(directory+"*.*"))
    return files

#----------------------------------------------

def get_js_files():
    files = glob.glob("./*.js")
    return files

#----------------------------------------------

def read_file(filename):
    file = open(filename,"r") 
    return file.read()

#----------------------------------------------

def create_file(filename,content):
    file = open(filename,"w+")
    file.write(content)
    file.close()

#----------------------------------------------

def write_file(filename,content):
    file = open(filename,"w")
    file.write(content)
    file.close()

#----------------------------------------------

def replace_in_file(content):
    global text_to_replace   
    if len(text_to_replace) > 0:
      for entry in text_to_replace:    
        content = content.replace(entry[0],entry[1])
    return content

#----------------------------------------------

def create_index_file(filename):
    '''
    create index index in file
    '''

    global js_overall_index, appVersion

    content = read_file(filename)
    index   = read_file(js_overall_index)

    new_lines_header = []
    new_lines_index  = []
    new_lines_body   = []
    length           = -1
    new_content      = ""

    start       = False
    end         = False
    content     = replace_in_file(content)

    if "/* INDEX" in content:

       lines       = content.split("\n")
       length      = len(lines)

       for line in lines:
          if  "*/" in line and start == True:        end   = True
          if start == False and end == False:        new_lines_header.append( line )
          if start == True  and end == True:         new_lines_body.append(   line )
          if "/* INDEX" in line and start == False:  start = True
          if "appVersion" in line and "var" in line: appVersion = line

       for line in new_lines_body:
          if ("function" in line) and not "setTimeout" in line and not "(function" in line and not "setInterval" in line:
             parts = line.split(")")
             new_lines_index.append( parts[0]+")" )

       for line in new_lines_header:
          new_content += line
          new_content += "\n"
       for line in new_lines_index:
          new_content += line
          new_content += "\n"
          
       i = 0
       for line in new_lines_body:
          i           += 1
          new_content += line
          if (i != len(new_lines_body)): 
            new_content += "\n"

    else:
       lines       = content.split("\n")
       for line in lines:
         if "appVersion" in line and "var" in line: appVersion = line

    index += "----------------------------\n"
    index += filename + " (" + str(length) + ")\n"
    index += "----------------------------\n"

    for line in new_lines_index:    index += line + "\n"

    write_file(js_overall_index,index)

    if start and end:
      #create_file(filename+".test",new_content)
      write_file(filename,new_content)

#----------------------------------------------

create_file(js_overall_index,"")

files = get_js_files()
for file in files: create_index_file(file)

content = ""
files   = get_cache_files()
version = appVersion.split("\"")

content += "CACHE MANIFEST\n"
content += "# "+str(datetime.date.today())+" Version "+version[1]+"\n"
content += "\nCACHE:\n"
content += "\n".join(files)
content += "\n"
content += "\nNETWORK:\n"
content += "\nFALLBACK:\n"

create_file(cache_manifest,content)

