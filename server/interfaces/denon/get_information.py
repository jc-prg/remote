import requests
import xml.etree.ElementTree as ET
import json
from datetime import datetime, timezone

DENON_IP = "192.168.1.97"   # <<< your AVR
TIMEOUT = 3

ENDPOINTS = {
    "main_zone": "/goform/formMainZone_MainZone.xml",
    "zone2": "/goform/formZone2_Zone2.xml",
    "net_audio": "/goform/formNetAudio_Status.xml",
    "system": "/goform/formSystem.xml",
    "device_info": "/goform/Deviceinfo.xml",
    "video_status": "/goform/formVideoStatus.xml",
}


def xml_to_dict(element):
    if len(element) == 0:
        return element.text

    result = {}
    for child in element:
        value = xml_to_dict(child)
        tag = child.tag.split("}")[-1]  # strip namespaces if present
        if tag in result:
            if not isinstance(result[tag], list):
                result[tag] = [result[tag]]
            result[tag].append(value)
        else:
            result[tag] = value
    return result


HEADERS = {
    "User-Agent": "Denon/1.0",
    "Accept": "*/*",
    "Connection": "close",
}

def try_fetch(url, verify_ssl=True):
    r = requests.get(
        url,
        headers=HEADERS,
        timeout=TIMEOUT,
        allow_redirects=False,
    )
    r.raise_for_status()
    return r.text

def fetch_endpoint(ip, path):
    http_url = f"http://{ip}{path}"
    https_url = f"https://{ip}{path}"

    # 1️⃣ Try HTTP first (preferred for Denon)
    try:
        xml_text = try_fetch(http_url)
    except Exception as http_error:
        # 2️⃣ Fallback to HTTPS with disabled cert check
        try:
            xml_text = try_fetch(https_url, verify_ssl=False)
        except Exception as https_error:
            return {
                "available": False,
                "http_error": str(http_error),
                "https_error": str(https_error),
            }

    try:
        xml = ET.fromstring(xml_text)
        return {
            "available": True,
            "parsed": xml_to_dict(xml),
            "raw_xml": xml_text,
        }
    except Exception as parse_error:
        return {
            "available": False,
            "error": f"XML parse failed: {parse_error}",
            "raw_xml": xml_text,
        }


def main():
    result = {
        "device_ip": DENON_IP,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "endpoints": {},
    }

    for name, path in ENDPOINTS.items():
        print(f"Querying {name} …")
        result["endpoints"][name] = fetch_endpoint(DENON_IP, path)

    output_file = f"denon_{DENON_IP.replace('.', '_')}.json"
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(result, f, indent=2)

    print(f"\n✔ Data written to {output_file}")


if __name__ == "__main__":
    # Silence SSL warnings (expected for Denon)
    requests.packages.urllib3.disable_warnings()
    main()
