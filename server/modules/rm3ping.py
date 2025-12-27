import pythonping
import ipaddress
import server.modules.rm3presets as rm3presets


ping_logger = rm3presets.set_logging("ping")

def is_valid_ipv4(address: str) -> bool:
    """Return True if the string is a valid IPv4 address."""
    try:
        ipaddress.IPv4Address(address)
        return True
    except ipaddress.AddressValueError:
        return False


def ping(host: str) -> bool:
    """
    Returns True if host (str) responds to a ping request.
    Includes validation: host must be a valid IPv4 address.
    """

    # Validate IPv4 address first
    if not is_valid_ipv4(host):
        ping_logger.debug(f"Invalid IPv4 address: {host}")
        return False

    # Send ping
    response_list = pythonping.ping(host, size=40, count=1)
    first_line = str(response_list).split("\n")[0]
    ping_logger.debug(f"PING {host}: {first_line}")

    # Check for successful reply
    if f"Reply from {host}" in str(response_list):
        return True

    # Optionally retry once more
    response_list = pythonping.ping(host, size=40, count=1)
    first_line = str(response_list).split("\n")[0]
    ping_logger.debug(f"PING {host} (retry): {first_line}")

    return f"Reply from {host}" in str(response_list)
