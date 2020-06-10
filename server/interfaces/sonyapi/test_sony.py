#!/usr/bin/python3

from sonyapi.sony import *

device = {
	"file" : "../../data/interfaces/SONY-BDP-S4500.json",
	"ip"   : "192.168.1.12",
	"name" : "Sony-BDP-S4500"
	}
	

myDevice = sonyDevice(device["ip"],device["name"],device["file"])

print(str(myDevice.test()))
