# homebridge-mitsubishi-va-ir
Arduino IR Plugin for [HomeBridge](https://github.com/nfarina/homebridge) (API 2.0)

### What this plugin does


### How this plugin works


### Things to know about this plugin

# Installation
1. Install homebridge using `npm install -g homebridge`.
2. Install this plugin using ``.
3. Update your configuration file. See configuration sample below.

# Configuration
Edit your `config.json` accordingly. Configuration sample:
 ```
    "accessories": [
        {
            "accessory": "MitsubishiVACIR",
            "name": "Mitsubishi VAC",
        }
    ],
```

### Advanced Configuration (Optional)
This step is not required. HomeBridge with API 2.0 can handle configurations in the HomeKit app.
 ```
    "accessories": [
        {
            "accessory": "MitsubishiVACIR",
            "name": "Mitsubishi VAC",
            "manufacturer": "Mitsubishi",
            "model": "Infrared Remote",
            "serialnumber": "KM05"
        }
    ],
```


| Fields             | Description                                           | Required |
|--------------------|-------------------------------------------------------|----------|
| platform           | Must always be `MitsubishiVACIR`.                     | Yes      |
| name               | Name of your device.                                  | No       |
| manufacturer       | Manufacturer of your device.                          | No       |
| model              | Model of your device.                                 | No       |
| serial             | Serial number of your device.                         | No       |

\*Changing the `name` in `config.json` will create a new device instead of renaming the existing one in HomeKit. It's strongly recommended that you rename the switch using a HomeKit app only.

