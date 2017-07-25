# homebridge-mitsubishi-vac-ir
Arduino Mitsubishi VAC IR Plugin for [HomeBridge](https://github.com/nfarina/homebridge)


### What this plugin does
Using an Arduino board with a temperature sensor (LM35) and a 940nm IR LED (VS1838B), with the firmware available in https://github.com/kounch/homebridge-mitsubishi-vac-ir, allows to control Mitsubishi Air Conditioners via Homekit.
Take note thas, as of iOS 10, Apple's Home App does not support yet Heater/Cooler devices, so another App like Elgato Eve is neeeded.


### How this plugin works


### Things to know about this plugin

# Installation
1. Install homebridge using `npm install -g homebridge`.
2. Install this plugin using `npm install -g --unsafe-perm homebridge-mitsubishi-vac-ir`.
3. Update your configuration file. See configuration sample below.


# Configuration
Edit your `config.json` accordingly. Configuration sample:
 ```
    "accessories": [
        {
            "accessory": "MitsubishiVACIR",
            "name": "Mitsubishi VAC"
        }
    ],
```


### Advanced Configuration (Optional)
This step is not required.
 ```
    "accessories": [
        {
            "accessory": "MitsubishiVACIR",
            "name": "Mitsubishi VAC",
            "portname": "/dev/ttyACM0",
            "manufacturer": "Mitsubishi",
            "model": "Infrared Remote",
            "serialnumber": "KM05",
            "references": [
                {
                    "sensor_value": 24.0,
                    "real_value": 26.0
                }
            ]
        }
    ],
```


| Fields             | Description                                           | Required |
|--------------------|-------------------------------------------------------|----------|
| platform           | Must always be `MitsubishiVACIR`.                     | Yes      |
| name               | Name of your device.                                  | No       |
| portname           | Name of the port connected to Arduino                 | No       |
| manufacturer       | Manufacturer of your device.                          | No       |
| model              | Model of your device.                                 | No       |
| serialnumber       | Serial number of your device.                         | No       |
| references         | List of "sensor_value" and "real_value" references    | No       |



\*Changing the `name` in `config.json` will create a new device instead of renaming the existing one in HomeKit. It's strongly recommended that you rename the switch using a HomeKit app only.


### Copyright

Copyright (c) 2017 kounch

Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED “AS IS” AND ISC DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL ISC BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
