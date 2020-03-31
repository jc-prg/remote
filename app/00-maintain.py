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

js_dir                   = "./"
js_overall_index         = "00-index-js.txt"
jc_overall_index_list    = {}
jc_overall_index_content = ""
jc_all_functions         = {}
appVersion               = "\"not found\""

cache_manifest     = "cache.manifest"
cache_manifest_dir = [
	"./"
	]

text_to_replace = [
#	[ "appPrintMenu", "appPrint_menu" ], # sample
	[ "movePosition", "apiDeviceMovePosition" ],
	[ "deleteButton", "apiButtonDelete" ],
	[ "addCommand", "apiCommandAdd" ],
	[ "deleteCommand", "apiCommandDelete" ],
	[ "sendCmd", "apiCommandSend" ],
	
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

    global jc_overall_index_content,js_overall_index, appVersion, jc_all_functions, jc_overall_index_list

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

    # if file with INDEX analyse and update INDEX
    if "/* INDEX" in content:

       lines       = content.split("\n")
       length      = len(lines)

       # split file into HEADER, INDEX-LIST, and BODY
       for line in lines:
          if  "*/" in line and start == True:        end   = True
          if start == False and end == False:        new_lines_header.append( line )
          if start == True  and end == True:         new_lines_body.append(   line )
          if "/* INDEX" in line and start == False:  start = True
          if "appVersion" in line and "var" in line: appVersion = line

       # search for functions in BODY
       for line in new_lines_body:
          if "function " in line or "function	" in line or "function(" in line and not "setTimeout" in line and not "setInterval" in line:
             parts1  = line.split(")")
             new_lines_index.append( parts1[0]+")" )
             if "=" not in parts1[0]:
               parts2 = parts1[0].split("ction ")
               parts3 = parts2[1].split("(")
               parts4 = parts3[0].split(" ")
               print(parts4[0])
               jc_all_functions[parts4[0]] = 0

       # write HEADER
       for line in new_lines_header:
          new_content += line
          new_content += "\n"
          
       # write INDEX
       for line in new_lines_index:
          new_content += line
          new_content += "\n"
       
       # write BODY
       i = 0
       for line in new_lines_body:
          i           += 1
          new_content += line
          if (i != len(new_lines_body)): 
            new_content += "\n"

    # else search for appVersion
    else:
       lines       = content.split("\n")
       for line in lines:
         if "appVersion" in line and "var" in line: appVersion = line

    # create INDEX file entry
    key = filename + " (" + str(length) + ")"
    jc_overall_index_list[key] = []
    
    jc_overall_index_content += "----------------------------\n"
    jc_overall_index_content += key + "\n"
    jc_overall_index_content += "----------------------------\n"

    for line in new_lines_index:    
      jc_overall_index_content += line + "\n"
      jc_overall_index_list[key].append(str(line))

    if start and end:
      #create_file(filename+".test",new_content)
      write_file(filename,new_content)

#----------------------------------------------

def count_functions(filename):

    global jc_all_functions

    content = read_file(filename)
    for key in jc_all_functions:
       jc_all_functions[key] += content.count(key+"(")
       jc_all_functions[key] += content.count(key+" ")
    

#----------------------------------------------


def create_overall_index():

    global jc_overall_index_content, jc_overall_index_list
    
    index = ""
    for key in jc_overall_index_list:
        key = str(key)
        index += "----------------------------\n"
        index += key + "\n"
        index += "----------------------------\n"
        
        for entry in jc_overall_index_list[key]:
           index += entry + "\n"
           
    index += "----------------------------\n"
    index += " USAGE ...\n"
    index += "----------------------------\n"
    
    for key in sorted(jc_all_functions):
      if jc_all_functions[key] > 100:  index += str(jc_all_functions[key]-1) + " - " + key + "\n"
      elif jc_all_functions[key] > 10: index += " " + str(jc_all_functions[key]-1) + " - " + key + "\n"
      else:                            index += "  " + str(jc_all_functions[key]-1) + " - " + key + "\n"

    write_file(js_overall_index,index) #jc_overall_index_content)



#----------------------------------------------

def create_manifest(files,version):

    global cache_manifest

    content = ""
    content += "CACHE MANIFEST\n"
    content += "# "+str(datetime.date.today())+" Version "+version[1]+"\n"
    content += "\nCACHE:\n"
    content += "\n".join(files)
    content += "\n"
    content += "\nNETWORK:\n"
    content += "\nFALLBACK:\n"

    create_file(cache_manifest,content)

#----------------------------------------------

create_file(js_overall_index,"")

files = get_js_files()
for file in sorted(files): create_index_file(file)
for file in sorted(files): count_functions(file)

create_overall_index()
create_manifest(get_cache_files(),appVersion.split("\""))

