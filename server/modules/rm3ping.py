import pythonping
import server.modules.rm3presets as rm3presets


ping_logger = rm3presets.set_logging("ping")


def ping(host):
    """
    Returns True if host (str) responds to a ping request.
    Remember that a host may not respond to a ping (ICMP) request even if the host name is valid.
    """

    response_list = pythonping.ping(host, size=40, count=1)
    ping_logger.debug("PING "+host+": "+str(response_list).split("\n")[0])
    
    if "Reply from "+host in str(response_list): return True 
    
    response_list = pythonping.ping(host, size=40, count=1)
    ping_logger.debug("PING "+host+": "+str(response_list).split("\n")[0])

    if "Reply from "+host in str(response_list):
        return True
    else:
        return False
