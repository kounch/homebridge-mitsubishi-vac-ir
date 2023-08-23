/*
homebridge-mitsubishi-vac-ir
Version 1.4.4

Mitsubihishi VAC IR Remote plugin for homebridge: https://github.com/nfarina/homebridge
Copyright (c) 2017-2023 @Kounch

Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby
granted, provided that the above copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED “AS IS” AND ISC DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL ISC BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS,
WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH 
THE USE OR PERFORMANCE OF THIS SOFTWARE.

Sample configuration file
{
    "bridge": {
      ...
    },
    "description": "...",
    "accessories": [
        {
            "accessory": "MitsubishiVACIR",
            "name": "Mitsubishi VAC"
        }
    ],
    "platforms":[
      ...
    ]
}
*/

var Service, Characteristic;
var SerialPort = require('serialport');
var Net = require('net');
var serialPort = null;

module.exports = function (homebridge) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  homebridge.registerAccessory("homebridge-mitsubishi-vac-ir", "MitsubishiVACIR", MitsubishiVACIRAccessory);
};

function MitsubishiVACIRAccessory(log, config) {
  this.log = log;
  this.lastCommandDate = new Date();
  this.mode = config.mode || "serial";
  if (this.mode == "serial") {
    this.portName = config.portname || "/dev/ttyACM0";
    this.portSpeed = config.portspeed || 19200;
    //this.log(this.portName + "," + this.portSpeed);
    serialPort = new SerialPort(this.portName, {
      baudRate: this.portSpeed
    });
  } else if (this.mode == "network") {
    this.hostname = config.hostname || "arduino_mitsubishi.local";
  } else {
    this.log("Unknown mode");
  }

  var default_references = [{ "sensor_value": 1.0, "real_value": 1.0 }];
  var references = config.references || default_references;
  if (references.length == 1) {
    var x1 = references[0].sensor_value;
    var y1 = references[0].real_value;

    if (x1 != 0) {
      this.slope = y1 / x1;
    } else {
      this.slope = 1.0;
    }
    this.intercept = 0.0;
  } else {
    var x1 = references[0].sensor_value;
    var y1 = references[0].real_value;
    var x2 = references[1].sensor_value;
    var y2 = references[1].real_value;

    if (x2 != x1) {
      this.slope = (y2 - y1) / (x2 - x1);
    } else {
      this.slope = 1.0;
    }
    this.intercept = y1 - (this.slope * x1);
  }

  this.name = config.name || "Mitsubishi VAC IR Accessory";
  this.manufacturer = config.manufacturer || "Mitsubishi";
  this.model = config.model || "Infrared Remote";
  this.serialnumber = config.serialnumber || "KM05";
  this.humidity = config.humidity || false;

  // Required Characteristics

  //Characteristic.Active.INACTIVE = 0;
  //Characteristic.Active.ACTIVE = 1;
  this.Active = Characteristic.Active.INACTIVE;

  //Read-only
  //Characteristic.CurrentHeaterCoolerState.INACTIVE;
  //Characteristic.CurrentHeaterCoolerState.IDLE;
  //Characteristic.CurrentHeaterCoolerState.HEATING;
  //Characteristic.CurrentHeaterCoolerState.COOLING;
  this.CurrentHeaterCoolerState = Characteristic.CurrentHeaterCoolerState.INACTIVE;

  //Characteristic.TargetHeaterCoolerState.AUTO;
  //Characteristic.TargetHeaterCoolerState.HEAT;
  //Characteristic.TargetHeaterCoolerState.COOL;
  this.TargetHeaterCoolerState = Characteristic.TargetHeaterCoolerState.AUTO;

  //Read-only
  this.CurrentTemperature = 23;

  // Optional Characteristics

  //Characteristic.LockPhysicalControls.CONTROL_LOCK_DISABLED;
  //Characteristic.LockPhysicalControls.CONTROL_LOCK_ENABLED;
  //this.LockPhysicalControls = Characteristic.LockPhysicalControls.CONTROL_LOCK_DISABLED;

  //Characteristic.SwingMode.SWING_DISABLED;
  //Characteristic.SwingMode.SWING_ENABLED;
  this.SwingMode = Characteristic.SwingMode.SWING_DISABLED;
  this.TargetHorizontalTiltAngle = 0;
  this.CurrentHorizontalTiltAngle = 0;

  this.CoolingThresholdTemperature = 22.0;
  this.HeatingThresholdTemperature = 24.0;

  //Characteristic.TemperatureDisplayUnits.CELSIUS;
  //Characteristic.TemperatureDisplayUnits.FAHRENHEIT;
  this.temperatureDisplayUnits = Characteristic.TemperatureDisplayUnits.CELSIUS;

  //Characteristic.TargetFanState.MANUAL = 0;
  //Characteristic.TargetFanState.AUTO = 1;
  this.TargetFanState = Characteristic.TargetFanState.AUTO;
  this.RotationSpeed = 0;

  if (this.humidity) {
    this.CurrentRelativeHumidity = 50;
  }

  this.service = new Service.HeaterCooler(this.name);
}

MitsubishiVACIRAccessory.prototype = {
  serialSendCmd: function (message, retries, timeout, callback) {
    var receivedData = "";
    var mssg = message;
    //Serial Events
    serialPort.on('data', function (data) {
      receivedData += data;
    }.bind(this));
    serialPort.on('close', function () {
      var result = "KO,Bad Serial Data,";
      var arrData = receivedData.split('\n');
      if (arrData[0].trim() == 'BOOT') {
        if (arrData.length > 1) {
          result = arrData.slice(1).join(",");
        }
      }
      arrData = result.split(",");
      if (arrData[0] == "OK") {
        callback(null, arrData.slice(1));
      } else {
        callback(new Error(arrData.slice(1)));
      }
    }.bind(this));
    serialPort.on('error', function (err) {
      callback(new Error("Serial error: " + err.message));
    }.bind(this));
    //Data Send
    //Wait 1700 milliseconds before sending and reading
    setTimeout(function () {
      for (var i = 0; i < mssg.length; i++) {
        serialPort.write(Buffer.from(mssg[i], 'ascii'));
      }
      // Send terminate character
      serialPort.write(Buffer.from('\n', 'ascii'));
      //Read after 400 milliseconds
      setTimeout(function () {
        var arrData = receivedData.split('\n');
        if (arrData[0].trim() == 'BOOT') {
          if (arrData.length > 1) {
            result = arrData.slice(1).join(",");
          }
        }
        arrData = result.split(",");
        if (arrData[0] == "OK") {
          callback(null, arrData.slice(1));
        } else {
          callback(new Error(arrData.slice(1)));
        }
        receivedData = '';
      }.bind(this), 400);
    }.bind(this), 1700);
  },
  netSendCmd: function (message, callback) {
    var timedOut = false;
    var client = new Net.Socket();
    client.setTimeout(3000);

    //Socket events
    client.on("data", function (data) {
      var answer = data.toString();
      var arrData = answer.split(",");
      if (arrData[0] == "OK") {
        callback(null, arrData.slice(1));
      } else {
        callback(new Error(arrData.slice(1)));
      }
    }.bind(this));
    client.on("error", function (network_error) {
      if (timedOut) {
        timedOut = false;
      } else {
        callback(network_error);
      }
    }.bind(this));
    client.on("close", function (had_error) {
      //this.log("Network connection closed");
    }.bind(this));
    client.on("timeout", function () {
      client.end();
      if (timedOut) {
        timedOut = false;
      } else {
        timedOut = true;
        callback(new Error("Network Timeout error"));
      }
    }.bind(this));

    //Connection
    client.connect(80, this.hostname, function () {
      client.write(message);
    }.bind(this));
  },
  delayedSendCmd: function (message, callback) {
    var currentDate = new Date();
    if ((currentDate - this.lastCommandDate) > 3000) {
      this.lastCommandDate = currentDate;
      if (this.mode == "serial") {
        //Send serial data
        this.serialSendCmd(message, 3, 1000, function (serial_error, thData) {
          if (serial_error) {
            this.log("Serial command function failed:", serial_error.message);
            callback(serial_error);
          } else {
            callback(null, thData);
          }
        }.bind(this));
      } else if (this.mode == "network") {
        //Send data through network
        this.netSendCmd(message, function (network_error, thData) {
          if (network_error) {
            this.log("Network command function failed:", network_error.message);
            callback(network_error);
          } else {
            callback(null, thData);
          }
        }.bind(this));
      } else {
        callback(new Error("Unknown mode on SendCmd"));
      }
    } else {
      // Try again after 3000 milliseconds
      setTimeout(function () {
        this.delayedSendCmd(message, function (error, thData) {
          if (error) {
            callback(error);
          } else {
            callback(null, thData);
          }
        }.bind(this));
      }.bind(this), 3000);
    }
  },
  sendCmd: function (that, callback) {
    var params = ["0", "22", "0", "0", "1"];

    //Default temperature and States
    var temperature = 22.0;
    var futureState = Characteristic.CurrentHeaterCoolerState.IDLE;
    var horizontalTiltAngle = 0;

    if (that.heatingThresholdTemperature) {
      temperature = that.heatingThresholdTemperature;
      futureState = Characteristic.CurrentHeaterCoolerState.HEATING;
    }
    if (that.CoolingThresholdTemperature) {
      temperature = that.CoolingThresholdTemperature;
      futureState = Characteristic.CurrentHeaterCoolerState.COOLING;
    }
    //Mode: 0-auto, 1-hot, 2-cold, 3-dry, 4-fan
    switch (that.TargetHeaterCoolerState) {
      case Characteristic.TargetHeaterCoolerState.AUTO:
        params[0] = "0";
        break;
      case Characteristic.TargetHeaterCoolerState.HEAT:
        params[0] = "1";
        temperature = that.HeatingThresholdTemperature;
        futureState = Characteristic.CurrentHeaterCoolerState.HEATING;
        break;
      case Characteristic.TargetHeaterCoolerState.COOL:
        params[0] = "2";
        temperature = that.CoolingThresholdTemperature;
        futureState = Characteristic.CurrentHeaterCoolerState.COOLING;
        break;
      default:
        params[0] = "0";
        break;
    }
    //ThresholdTemperature (celsius, int)
    params[1] = Math.round(temperature).toString();
    //Fan: 0-auto, 1,2,3,4,5-speed, 6-Silent)
    //RotationSpeed: 0-Silent, 20,40,60,80,100
    params[2] = "6";
    if (that.RotationSpeed) {
      params[2] = (parseInt(that.RotationSpeed) / 20).toString();
    }
    if (that.TargetFanState == Characteristic.TargetFanState.AUTO) {
      params[2] = 0;
    }
    //Vane:  0-auto, 1,2,3,4,5-angle, 6-moving)
    if (that.TargetHorizontalTiltAngle) {
      horizontalTiltAngle = parseInt(that.TargetHorizontalTiltAngle);
    }
    if (that.SwingMode == Characteristic.SwingMode.SWING_ENABLED) {
      horizontalTiltAngle = -54;
    }
    params[3] = (-horizontalTiltAngle / 9).toString();
    //Status: 0-off, 1-on
    params[4] = "1";
    if (that.Active == Characteristic.Active.INACTIVE) {
      params[4] = "0";
      futureState = Characteristic.CurrentHeaterCoolerState.INACTIVE;
    }
    var msg = "S," + params.join(",");
    this.delayedSendCmd(msg, function (error, thData) {
      if (error) {
        callback(error);
      } else {
        this.CurrentHeaterCoolerState = futureState;
        callback(null);
      }
    }.bind(this));
  },
  //Start
  identify: function (callback) {
    this.log("Identify requested!");
    callback(null);
  },
  // Required
  getActive: function (callback) {
    this.log("getActive :", this.Active);
    callback(null, this.Active);
  },
  setActive: function (value, callback) {
    this.log("setActive from/to:", this.Active, value);
    var that = this;
    that.Active = value;
    this.sendCmd(that, function (error) {
      if (error) {
        callback(error);
      } else {
        this.Active = value;
        callback(null);
      }
    }.bind(this));
  },
  getCurrentHeaterCoolerState: function (callback) {
    this.log("getCurrentHeaterCoolerState: ", this.CurrentHeaterCoolerState);
    callback(null, this.CurrentHeaterCoolerState);
  },
  getTargetHeaterCoolerState: function (callback) {
    this.log("getTargetHeaterCoolerState", this.TargetHeaterCoolerState);
    callback(null, this.TargetHeaterCoolerState);
  },
  setTargetHeaterCoolerState: function (value, callback) {
    if (value === undefined) {
      callback(null);
    } else {
      this.log("setTargetHeaterCoolerState from/to:", this.TargetHeaterCoolerState, value);
      var that = this;
      that.TargetHeaterCoolerState = value;
      this.sendCmd(that, function (error) {
        if (error) {
          callback(error);
        } else {
          this.TargetHeaterCoolerState = value;
          callback(null);
        }
      }.bind(this));
    }
  },
  getCurrentTemperature: function (callback) {
    this.log("getCurrentTemperature");
    msg = "G";
    this.delayedSendCmd(msg, function (error, thData) {
      if (error) {
        callback(error);
      } else {
        this.log("Sensor:", Math.round(thData[0].trim() * 100) / 100);
        temperature = (thData[0] * this.slope) + this.intercept;
        this.CurrentTemperature = Math.round(temperature * 100) / 100;
        this.log("Temperature:", this.CurrentTemperature)
        callback(null, this.CurrentTemperature);
      }
    }.bind(this));
  },
  // Optional
  getSwingMode: function (callback) {
    this.log("getSwingMode:", this.SwingMode);
    callback(null, this.SwingMode);
  },
  setSwingMode: function (value, callback) {
    if (value === undefined) {
      callback(null);
    } else {
      this.log("setSwingMode from/to:", this.SwingMode, value);
      var that = this;
      that.SwingMode = value;
      this.sendCmd(that, function (error) {
        if (error) {
          callback(error);
        } else {
          this.SwingMode = value;
          callback(null);
        }
      }.bind(this));
    }
  },
  getCoolingThresholdTemperature: function (callback) {
    this.log("getCoolingThresholdTemperature:", this.CoolingThresholdTemperature);
    callback(null, this.CoolingThresholdTemperature);
  },
  setCoolingThresholdTemperature: function (value, callback) {
    if (value === undefined) {
      callback(null);
    } else {
      this.log("setCoolingThresholdTemperature from/to:", this.CoolingThresholdTemperature, value);
      var that = this;
      that.CoolingThresholdTemperature = value;
      this.sendCmd(that, function (error) {
        if (error) {
          callback(error);
        } else {
          this.CoolingThresholdTemperature = value;
          callback(null);
        }
      }.bind(this));
    }
  },
  getHeatingThresholdTemperature: function (callback) {
    this.log("getHeatingThresholdTemperature:", this.HeatingThresholdTemperature);
    callback(null, this.HeatingThresholdTemperature);
  },
  setHeatingThresholdTemperature: function (value, callback) {
    if (value === undefined) {
      callback(null);
    } else {
      this.log("setHeatingThresholdTemperature from/to:", this.HeatingThresholdTemperature, value);
      var that = this;
      that.HeatingThresholdTemperature = value;
      this.sendCmd(that, function (error) {
        if (error) {
          callback(error);
        } else {
          this.HeatingThresholdTemperature = value;
          callback(null);
        }
      }.bind(this));
    }
  },
  getTemperatureDisplayUnits: function (callback) {
    this.log("getTemperatureDisplayUnits:", this.temperatureDisplayUnits);
    callback(null, this.temperatureDisplayUnits);
  },
  setTemperatureDisplayUnits: function (value, callback) {
    this.log("setTemperatureDisplayUnits from %s to %s", this.temperatureDisplayUnits, value);
    this.temperatureDisplayUnits = value;
    callback(null);
  },
  getRotationSpeed: function (callback) {
    this.log("getRotationSpeed:", this.RotationSpeed);
    callback(null, this.RotationSpeed);
  },
  setRotationSpeed: function (value, callback) {
    if (value === undefined) {
      callback(null);
    } else {
      this.log("setRotationSpeed from/to:", this.RotationSpeed, value);
      var that = this;
      that.RotationSpeed = value;
      this.sendCmd(that, function (error) {
        if (error) {
          callback(error);
        } else {
          this.RotationSpeed = value;
          callback(null);
        }
      }.bind(this));
    }
  },
  getTargetFanState: function (callback) {
    this.log("getTargetFanState:", this.TargetFanState);
    callback(null, this.TargetFanState);
  },
  setTargetFanState: function (value, callback) {
    if (value === undefined) {
      callback(null);
    } else {
      this.log("setTargetFanState from/to:", this.TargetFanState, value);
      var that = this;
      that.TargetFanState = value;
      this.sendCmd(that, function (error) {
        if (error) {
          callback(error);
        } else {
          this.TargetFanState = value;
          callback(null);
        }
      }.bind(this));
    }
  },
  getTargetHorizontalTiltAngle: function (callback) {
    this.log("getTargetHorizontalTiltAngle:", this.TargetHorizontalTiltAngle);
    callback(null, this.TargetHorizontalTiltAngle);
  },
  setTargetHorizontalTiltAngle: function (value, callback) {
    if (value === undefined) {
      callback(null);
    } else {
      this.log("setTargetHorizontalTiltAngle from/to:", this.TargetHorizontalTiltAngle, value);
      var that = this;
      that.TargetHorizontalTiltAngle = value;
      this.sendCmd(that, function (error) {
        if (error) {
          callback(error);
        } else {
          this.TargetHorizontalTiltAngle = value;
          this.CurrentHorizontalTiltAngle = value;
          callback(null);
        }
      }.bind(this));
    }
  },
  getCurrentHorizontalTiltAngle: function (callback) {
    this.log("getTargetHorizontalTiltAngle:", this.CurrentHorizontalTiltAngle);
    callback(null, this.CurrentHorizontalTiltAngle);
  },
  getCurrentRelativeHumidity: function (callback) {
    this.log("getCurrentRelativeHumidity");
    msg = "G";
    this.delayedSendCmd(msg, function (error, thData) {
      if (error) {
        callback(error);
      } else {
        this.CurrentRelativeHumidity = Math.round(thData[1].trim() * 100) / 100;
        this.log("Humidity:", this.CurrentRelativeHumidity)
        callback(null, this.CurrentRelativeHumidity);
      }
    }.bind(this));
  },
  getName: function (callback) {
    this.log("getName :", this.name);
    callback(null, this.name);
  },
  getServices: function () {
    // you can OPTIONALLY create an information service if you wish to override
    // the default values for things like serial number, model, etc.
    var informationService = new Service.AccessoryInformation();

    informationService
      .setCharacteristic(Characteristic.Manufacturer, this.manufacturer)
      .setCharacteristic(Characteristic.Model, this.model)
      .setCharacteristic(Characteristic.SerialNumber, this.serialnumber);

    // Required Characteristics
    this.service
      .getCharacteristic(Characteristic.Active)
      .on('get', this.getActive.bind(this))
      .on('set', this.setActive.bind(this));

    this.service
      .getCharacteristic(Characteristic.CurrentHeaterCoolerState)
      .on('get', this.getCurrentHeaterCoolerState.bind(this));

    this.service
      .getCharacteristic(Characteristic.TargetHeaterCoolerState)
      .on('get', this.getTargetHeaterCoolerState.bind(this))
      .on('set', this.setTargetHeaterCoolerState.bind(this));

    this.service
      .getCharacteristic(Characteristic.CurrentTemperature)
      .on('get', this.getCurrentTemperature.bind(this));


    // Optional Characteristics

    this.service
      .getCharacteristic(Characteristic.SwingMode)
      .on('get', this.getSwingMode.bind(this))
      .on('set', this.setSwingMode.bind(this));

    this.service
      .getCharacteristic(Characteristic.CoolingThresholdTemperature)
      .on('get', this.getCoolingThresholdTemperature.bind(this))
      .on('set', this.setCoolingThresholdTemperature.bind(this));

    this.service
      .getCharacteristic(Characteristic.HeatingThresholdTemperature)
      .on('get', this.getHeatingThresholdTemperature.bind(this))
      .on('set', this.setHeatingThresholdTemperature.bind(this));

    this.service
      .getCharacteristic(Characteristic.TemperatureDisplayUnits)
      .on('get', this.getTemperatureDisplayUnits.bind(this))
      .on('set', this.setTemperatureDisplayUnits.bind(this));

    this.service
      .getCharacteristic(Characteristic.RotationSpeed)
      .on('get', this.getRotationSpeed.bind(this))
      .on('set', this.setRotationSpeed.bind(this));

    this.service
      .getCharacteristic(Characteristic.Name)
      .on('get', this.getName.bind(this));

    //this.service.getCharacteristic(Characteristic.CurrentTemperature)
    //  .setProps({
    //    minValue: 0,
    //    maxValue: 45,
    //    minStep: 1
    //  });

    this.service.getCharacteristic(Characteristic.CoolingThresholdTemperature)
      .setProps({
        minValue: 10,
        maxValue: 35,
        minStep: 1
      });

    this.service.getCharacteristic(Characteristic.HeatingThresholdTemperature)
      .setProps({
        minValue: 0,
        maxValue: 25,
        minStep: 1
      });

    this.service.getCharacteristic(Characteristic.RotationSpeed)
      .setProps({
        minValue: 0,
        maxValue: 100,
        minStep: 20
      });

    //Extra Characteristics
    this.service.addOptionalCharacteristic(Characteristic.TargetFanState);
    this.service
      .getCharacteristic(Characteristic.TargetFanState)
      .on('get', this.getTargetFanState.bind(this))
      .on('set', this.setTargetFanState.bind(this));

    this.service.addOptionalCharacteristic(Characteristic.SlatType);
    this.service.setCharacteristic(Characteristic.SlatType, Characteristic.SlatType.HORIZONTAL);

    this.service.addOptionalCharacteristic(Characteristic.TargetHorizontalTiltAngle);
    this.service
      .getCharacteristic(Characteristic.TargetHorizontalTiltAngle)
      .on('get', this.getTargetHorizontalTiltAngle.bind(this))
      .on('set', this.setTargetHorizontalTiltAngle.bind(this));

    this.service.getCharacteristic(Characteristic.TargetHorizontalTiltAngle)
      .setProps({
        maxValue: 0,
        minValue: -45,
        minStep: 9
      });

    this.service.addOptionalCharacteristic(Characteristic.CurrentHorizontalTiltAngle);
    this.service
      .getCharacteristic(Characteristic.CurrentHorizontalTiltAngle)
      .on('get', this.getCurrentHorizontalTiltAngle.bind(this));

    if (this.humidity) {
      this.service.addOptionalCharacteristic(Characteristic.CurrentRelativeHumidity);
      this.service
        .getCharacteristic(Characteristic.CurrentRelativeHumidity)
        .on('get', this.getCurrentRelativeHumidity.bind(this));
    }

    return [informationService, this.service];
  }
};
