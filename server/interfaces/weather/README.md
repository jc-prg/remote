
# API Description: Open Meteo Weather + GeoPy (Read only)

## Source

* API Description - Open Meteo: https://open-meteo.com/en/docs
* API Description - PyGeo: https://mdolab-pygeo.readthedocs-hosted.com/en/latest/index.html

## Open Meteo Weather & GeoPy

This module collects the current weather data from Open Meteo based on GPS data or a location. If a location is given, GPS data are
identified using GeoPy. Access to forecast weather data is not implemented yet.

### Configure

* Set the WEATHER module active in the API settings. 
* Edit the Location or the LocationGPS in the API configuration of the API-Device WEATHER_default. If both is set, LocationsGPS has priority.
* To use WEATHER of more than location create addition API-Devices.
* Alternatively edit the configuration in [data/devices/WEATHER/00_interface.json](../../../data/_sample/devices/WEATHER/00_interface.json)

```json
{
  "Description": "Open Meteo Weather (incl. GeoPy)",
  "IPAddress": "127.0.0.1",
  "Interval": 600,
  "Location": "Munich",
  "LocationGPS": [48.14, 11.58],
  "Methods": ["query"],
  "MultiDevice": false,
  "Timeout": 5
}
```

## Device Definition

The default configuration [data/devices/WEATHER/00_default.json](../../../data/_sample/devices/WEATHER/00_default.json) enables access to the 
current weather data. To create a remote control just create a new (empty) device configuration.
