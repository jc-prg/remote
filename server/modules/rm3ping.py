import socket
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
    try:
        response_list = pythonping.ping(host, size=40, count=1)
        first_line = str(response_list).split("\n")[0]
        ping_logger.debug(f"PING {host}: {first_line}")

    except Exception as e:
        ping_logger.error(f"PING {host} failed: {e}")
        response_list = ""

    # Check for successful reply
    if f"Reply from {host}" in str(response_list):
        return True

    # Optionally retry once more
    try:
        response_list = pythonping.ping(host, size=40, count=1)
    except Exception as e:
        ping_logger.error(f"PING {host} failed (retry): {e}")
        return False

    first_line = str(response_list).split("\n")[0]
    ping_logger.debug(f"PING {host} (retry): {first_line}")

    return f"Reply from {host}" in str(response_list)


def get_gateway_ip(network_str):
    """Infer the default gateway from a given network (usually the first usable IP)."""
    network = ipaddress.IPv4Network(network_str, strict=False)
    # Typically the gateway is the first usable IP (network + 1)
    gateway_ip = network.network_address + 1
    return str(gateway_ip)


def local_network_exists(host=None, port=80, timeout=3):
    REMOTE_LOCAL_NETWORK=rm3presets.local_network
    # If no host is provided, use the gateway IP
    if host is None:
        host = get_gateway_ip(REMOTE_LOCAL_NETWORK)
    try:
        # Check if the host is in the specified local network range
        network = ipaddress.IPv4Network(REMOTE_LOCAL_NETWORK, strict=False)
        host_ip = ipaddress.IPv4Address(host)
        if host_ip not in network:
            ping_logger.warning(f"{host} is not in the defined local network range {REMOTE_LOCAL_NETWORK}.")
            return False

        # Try to connect to the host (gateway) within the local network
        socket.setdefaulttimeout(timeout)
        socket.socket(socket.AF_INET, socket.SOCK_STREAM).connect((host, port))
        return True
    except OSError:
        return False
    except ValueError as e:
        ping_logger.error(f"Invalid IP address or network range: {e}")
        return False


