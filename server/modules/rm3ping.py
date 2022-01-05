import os
import shlex, subprocess #  subprocess.run(args, *, stdin=None, input=None, stdout=None, stderr=None, shell=False, timeout=None, check=False)
import re
import urllib
import logging
import platform    # For getting the operating system name
import pythonping

#response_list = ping('8.8.8.8', size=40, count=10)

#--------------------------------------------

def ping(host):
    """
    Returns True if host (str) responds to a ping request.
    Remember that a host may not respond to a ping (ICMP) request even if the host name is valid.
    """

    response_list = pythonping.ping(host, size=40, count=1)
    logging.debug("PING "+host+": "+str(response_list).split("\n")[0])
    
    if "Reply from "+host in str(response_list): return True 
    
    response_list = pythonping.ping(host, size=40, count=1)
    logging.debug("PING "+host+": "+str(response_list).split("\n")[0])

    if "Reply from "+host in str(response_list): return True 
    else:                                        return False
