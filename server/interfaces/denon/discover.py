import asyncio
import socket
import time
import re
import requests
from xml.etree import ElementTree as ET
import denonavr

SSDP_GROUP = ("239.255.255.250", 1900)
MSEARCH_MSG = (
    "M-SEARCH * HTTP/1.1\r\n"
    "HOST:239.255.255.250:1900\r\n"
    "MAN:\"ssdp:discover\"\r\n"
    "MX:2\r\n"
    "ST:ssdp:all\r\n"
    "\r\n"
)

TIMEOUT = 5


def discover_denon_avrs():
    discovered = {}

    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM, socket.IPPROTO_UDP)
    sock.settimeout(TIMEOUT)
    sock.sendto(MSEARCH_MSG.encode("utf-8"), SSDP_GROUP)

    start = time.time()

    while time.time() - start < TIMEOUT:
        try:
            data, addr = sock.recvfrom(65507)
            response = data.decode("utf-8", errors="ignore")

            # Look for Denon / Marantz / HEOS
            if not re.search(r"denon|marantz|heos", response, re.IGNORECASE):
                continue

            ip = addr[0]

            location = None
            for line in response.split("\r\n"):
                if line.lower().startswith("location:"):
                    location = line.split(":", 1)[1].strip()
                    break

            if not location or ip in discovered:
                continue

            info = fetch_device_info(location)
            discovered[ip] = info

        except socket.timeout:
            break

    sock.close()
    return discovered


def fetch_device_info(description_url):
    info = {
        "model": None,
        "friendly_name": None,
        "manufacturer": None,
        "description_url": description_url,
    }

    try:
        r = requests.get(description_url, timeout=2)
        xml = ET.fromstring(r.text)

        ns = {"upnp": "urn:schemas-upnp-org:device-1-0"}

        info["friendly_name"] = xml.findtext(".//upnp:friendlyName", namespaces=ns)
        info["manufacturer"] = xml.findtext(".//upnp:manufacturer", namespaces=ns)
        info["model"] = xml.findtext(".//upnp:modelName", namespaces=ns)

    except Exception:
        pass

    return info


async def try_connect(ip_address):
    print(f"Try to connect to {ip_address} ...")
    d = denonavr.DenonAVR(ip_address)
    await d.async_setup()
    await d.async_update()
    print(f"Power  = {d.power}")
    print(f"Input  = {d.input_func}")
    print(f"Volume = {d.volume}")


if __name__ == "__main__":
    avrs = discover_denon_avrs()

    if not avrs:
        print("No Denon / Marantz AVRs found.")
    else:
        print("Discovered Denon / Marantz AVRs:\n")
        for ip, info in avrs.items():
            print(f"IP Address     : {ip}")
            print(f"Model          : {info['model']}")
            print(f"Name           : {info['friendly_name']}")
            print(f"Manufacturer   : {info['manufacturer']}")
            print(f"Description URL: {info['description_url']}")
            print("-" * 40)
            if info['manufacturer'] == "Denon":
                asyncio.run(try_connect(ip))
            print("-" * 40)
