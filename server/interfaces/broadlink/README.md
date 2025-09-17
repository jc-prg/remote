# API Description: BROADLINK

## Source

* Python sources: [mjg59/python-broadlink](https://github.com/mjg59/python-broadlink) v0.19.0.
  
## How to install a Broadlink RM controller


1. Load the Broadlink App for your mobile device
2. Connect the Broadlink device to your wifi network as described in the Quick Setup Guide: [https://www.ibroadlink.com/downloads](https://www.ibroadlink.com/downloads)
3. Unlock the device using the app in the device settings for RM4 mini
4. Check the connection and identify data required for configuration using the [test_connect.py](test_connect.py):

```python
import broadlink

# Step 1: Discover devices on the local network
devices = broadlink.discover(timeout=5)  # timeout in seconds
if not devices:
    print("No devices found.")
    exit(1)

# Print information for all devices
print(str(devices))

# Pick the first device (if you have multiple, you can filter by host/mac)
for device in devices:
    print(f"")
    print(f"--- Found device")
    print(f" Name: {device.name}")
    print(f" Model: {device.model}")
    print(f" IP address and port: {device.host}")
    mac_str = ':'.join(f'{b:02x}' for b in device.mac)
    print(f" MAC address: '{mac_str}'")
    print(f" Device type: {device.devtype}")

    # Step 2: Authenticate with the device
    try:
        device.auth()
        print(" Authentication successful.")
    except Exception as e:
        print(f" Could not connect with device: {e}")

    # Step 3: Check if sensor data are available
    try:
        data = device.check_sensors()
        print(f" Device has sensor data: {data}")
    except Exception as e:
        print(" No sensor data available for this device: " + str(e))

    # Step 4: Send a command (replace with your learned data in hex/base64)
    # Example: A sample IR code (TV power toggle). Replace with your actual data.
    # You can learn codes with device.enter_learning() and device.check_data().
    ir_hex = "2600d2009493111111113711111111371137111111111111371137111111371111371137111111111111111111371111371111371111111111111111371111371111371111111111111111111111111111111111111111111111111111111111111111111111"
    payload = bytes.fromhex(ir_hex)

    device.send_data(payload)
    print(" Command sent successfully!")

print("")
print("Done.")
```
5. Configure the broadlink device in jc://remote/ 
    * Option 1: change settings using the app in "Settings > API Settings > API: BROADLINK" and reconnect. 
      Hint: there you only can change the configuration but not add another device.
    * Option 2: edit the file [data/devices/BROADLINK/00_interfaces.json](BROADLINK.json)
6. Ensure on your router that your Broadlink device keeps the same IPv4 address everytime.

## Additional jc://remote/ API Commands

This device has no REST API that can be use to request information and there are no jc://remote/ API commands defined at the moment.
