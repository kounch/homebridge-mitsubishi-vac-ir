# homebridge-mitsubishi-vac-ir
Arduino Mitsubishi VAC IR Plugin for [HomeBridge](https://github.com/nfarina/homebridge)


---


## English

### What this plugin does
Using an Arduino board, it sends IR commands to a Mitsubishi Air Conditioner emulating an infrared remote.

Available commands:
* Target Heater Cooler State (Auto, Heat or Cool)
* Target Temperature for Heater and/or Cooler
* Vane Angle
* Automatic Vane Swing
* Fan Speed (including Silent Mode)
* Automatic Fan Speed

Take note thas, as of iOS 10, Apple's Home App does not support yet Heater/Cooler devices, so another App like Elgato Eve is neeeded. Starting with iOS 11, basic usage os Heater/Cooler is available with Home App, but controls like vane angle or Automatic Fan Speed aren't available yet. To use these, you will still need another App.


### How this plugin works
Using an Arduino board with a temperature sensor (LM35) or a temperature and humidity sensor (DHT22) and a 940nm IR LED (VS1838B), with the firmware available in https://github.com/kounch/homebridge_mitsubishi_ir_arduino, allows to control Mitsubishi Air Conditioners via Homekit.

You can send orders to the Arduino board using a serial connection or, if the Arduino has also connected an ESP8266, using a network connection instead.

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
This step is not required, unless you want to use the network access mode.

#### Serial Mode
 ```
    "accessories": [
        {
            "accessory": "MitsubishiVACIR",
            "name": "Mitsubishi VAC",
            "mode": "serial",
            "portname": "/dev/ttyACM0",
            "portspeed": 19200,
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
#### Network mode
 ```
    "accessories": [
        {
            "accessory": "MitsubishiVACIR",
            "name": "Mitsubishi VAC",
            "mode": "network",
            "hostname": "arduino_mitsubishi.local",
            "manufacturer": "Mitsubishi",
            "model": "Infrared Remote",
            "serialnumber": "KM05",
            "references": [
                {
                    "sensor_value": 24.0,
                    "real_value": 26.0
                },
            "humidity": false
            ]
        }
    ],
```
#### Temperature Calibration
It is also possible to calibrate the temperature values adding one or two reference values. For example, if the sensor reports 24 degrees when the real temperature is 26 degrees, and 17.5 when 16, using two references like these:
 ```
            "references": [
                {
                    "sensor_value": 24.0,
                    "real_value": 26.0
                },
                                {
                    "sensor_value": 17.5,
                    "real_value": 16.0
                }
            ]
 ```


| Fields             | Description                                           | Required |
|--------------------|-------------------------------------------------------|----------|
| platform           | Must always be `MitsubishiVACIR`.                     | Yes      |
| name               | Name of your device.                                  | No       |
| mode               | Connection mode, must be `serial` or `network`        | No       |
| portname           | Name of the serial port connected to Arduino          | No       |
| portspeed          | Speed of the serial port connected to Arduino         | No       |
| hostname           | Hostname or IP Address of Arduino Network Interface   | No       |
| manufacturer       | Manufacturer of your device.                          | No       |
| model              | Model of your device.                                 | No       |
| serialnumber       | Serial number of your device.                         | No       |
| references         | List of "sensor_value" and "real_value" references    | No       |
| humidity           | If true, current humidity is obtained too (DHT22)     | No       |



\*Changing the `name` in `config.json` will create a new device instead of renaming the existing one in HomeKit. It's strongly recommended that you rename the accessory using a HomeKit app only.


---


## Castellano

### Para qué sirve este plugin
Usando una placa Arduino, envía comandos infrarrojos a una ire acondicionado Mitsubishi imitando un mando a distancia.

Comandos disponibles:
* Modo deseado (Automático, Calor o Frío)
* Temperatura desead para calentar y/o enfriar
* Ángulo de las aletas
* Modo de oscilación automático de las aletas
* Velocidad del ventilador (incluyendo modo silencioso)
* Velocidad automática del ventilador

Señalar que, en iOS 10, la aplicación Casa de Apple todavía no es compatible con dispositivos de aire acondicionado, así que es necesario utilizar otra aplicación como Elgato Eve. A partir de iOS 11, la aplicación Casa ofrece un uso básico, pero controles como el ángulo de las aletas o la velocidad automática del ventilador siguen sin estar disponibles. Para acceder a estos controles, aún es necesario utilizar otra aplicación de terceros.


### Cómo funciona
Usando una placa Arduino con un sensor de temperatura (LM35) o un sensor de temperatura y humedad (DHT22) y un LED infrarrojo de 940nm (VS1838B), usando el firmoware disponible en https://github.com/kounch/homebridge_mitsubishi_ir_arduino, permite controlar dispositivos de aire acondicionado de Mitsubishi usando Homekit.

Se pueden enviar las órdenes a la placa Arduino a través de una conexión serie o, si tiene conectado un ESP8266, con una conexión de red en su lugar.

### Más información

### Instalación
1. Instalar homebridge usando `npm install -g homebridge`.
2. Instalar este plugin con el comando `npm install -g --unsafe-perm homebridge-mitsubishi-vac-ir`.
3. Actualizar el fichero de configuración. Véase un ejemplo a continuación.


### Configuración
Editar el fichero `config.json` según se necesite. Ejemplo de configuración:
 ```
    "accessories": [
        {
            "accessory": "MitsubishiVACIR",
            "name": "Aire Acondicionado del Dormitorio"
        }
    ],
```


### Configuración avanzada (opcional)
Este paso no es necesario, a no ser que se desee utilizar el modo de acceso vía red.
 
#### Modo conexión serie
 ```
    "accessories": [
        {
            "accessory": "MitsubishiVACIR",
            "name": "Aire de la Sala",
            "mode": "serial",
            "portname": "/dev/ttyACM0",
            "portspeed": 19200,
            "manufacturer": "Mitsubishi",
            "model": "Mando infrarrojo",
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
#### Modo conexión de red
 ```
    "accessories": [
        {
            "accessory": "MitsubishiVACIR",
            "name": "AC Mitsubishi",
            "mode": "network",
            "hostname": "arduino_mitsubishi.local",
            "manufacturer": "Mitsubishi",
            "model": "Control Remoto",
            "serialnumber": "KM05",
            "references": [
                {
                    "sensor_value": 24.0,
                    "real_value": 26.0
                },
            "humidity": false
            ]
        }
    ],
```
#### Calibración de temperatura
También es posible realizar una calibración de los valores de temperatura del sensor añadiendo uno o dos valores de referencia. Por ejemplo, si se observa que el sensor indica 24 grados a los 26 grados reales y 17,5 a los 16 reales, con dos referencias así:
 ```
            "references": [
                {
                    "sensor_value": 24.0,
                    "real_value": 26.0
                },
                                {
                    "sensor_value": 17.5,
                    "real_value": 16.0
                }
            ]
 ```


| Campos             | Descrición                                            | Requerido |
|--------------------|-------------------------------------------------------|-----------|
| platform           | Debe ser siempre `MitsubishiVACIR`.                   | Sí        |
| name               | Nombre del dispositivo                                | No        |
| mode               | Modo de conexión, debe ser `serial` o `network`       | No        |
| portname           | Nombre del puerto serie conectado a Arduino           | No        |
| portspeed          | Velocidad del puerto serie conectado a Arduino        | No        |
| hostname           | Nombre de host o dirección IP de Arduino              | No        |
| manufacturer       | Fabricante del dispositivo                            | No        |
| model              | Modelo del dispositivo                                | No        |
| serialnumber       | Número de seri del dispositivo                        | No        |
| references         | Lista de referencias "sensor_value" y "real_value"    | No        |
| humidity           | Si es true, se obtendrán datos de humedad (DHT22)     | No        |


\*Cambiar el nombre `name` en `config.json` creará un nuevo dispositivo en vez de renombrar el existente en Homekit. Se recomienda que sólo se cambie el nombre del accesorio usando una App de HomeKit.


### Copyright

Copyright (c) 2017 kounch

Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED “AS IS” AND ISC DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL ISC BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
