/*
homebridge-mitsubishi-vac-ir
Version 0.0.2

Mitsubihishi VAC IR Remote plugin for homebridge: https://github.com/nfarina/homebridge
Copyright (c) 2017 @Kounch

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

module.exports = function (homebridge) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  homebridge.registerAccessory("homebridge-mitsubishi-vac-ir", "MitsubishiVACIR", MitsubishiVACIRAccessory);
};

function MitsubishiVACIRAccessory(log, config) {
  this.log = log;
  this.portName = config.portname || "/dev/ttyACM0";

  this.name = config.name || "Mitsubishi VAC IR Accessory";
  this.manufacturer = config.manufacturer || "Mitsubishi";
  this.model = config.model || "Infrared Remote";
  this.serialnumber = config.serialnumber || "KM05";

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

  this.CoolingThresholdTemperature = 22.0;
  this.HeatingThresholdTemperature = 24.0;

  //Characteristic.TemperatureDisplayUnits.CELSIUS;
  //Characteristic.TemperatureDisplayUnits.FAHRENHEIT;
  this.temperatureDisplayUnits = Characteristic.TemperatureDisplayUnits.CELSIUS;

  this.RotationSpeed = 0;

  this.service = new Service.HeaterCooler(this.name);
}

MitsubishiVACIRAccessory.prototype = {
  serialSendCmd: function (message, callback) {
    this.log("Serial port message:", message);

    var datos = "";
    var serialPort = new SerialPort(this.portName, {
      baudrate: 9600
    });

    //Serial Port Events
    serialPort.on("open", function () {
      //this.log("open");
    }.bind(this));;
    serialPort.on('data', function (data) {
      datos += data;
    }.bind(this));;
    serialPort.on('close', function () {
      //this.log("closed");
    }.bind(this));;

    //Send Data after 2 seconds
    setTimeout(function (mensa) {
      //this.log("sending...");
      for (var i = 0; i < mensa.length; i++) {
        serialPort.write(new Buffer(mensa[i], 'ascii'), function (err, results) {
          // this.log('Error: ' + err);
          // this.log('Results ' + results);
        });
      }
      // Sending the terminate character
      serialPort.write(new Buffer('\n', 'ascii'), function (err, results) {
        // this.log('err ' + err);
        // this.log('results ' + results);
      });
      //this.log("sent");

      // Get data and close port after 2.5 seconds
      setTimeout(function () {
        //this.log("closing....");
        serialPort.close();

        var result = "KO,Bad Serial Data";
        var arrData = datos.split('\n');
        if (arrData[0].trim() == 'BOOT') {
          if (arrData.length > 1) {
            result = arrData[1].trim();
          }
        }
        arrData = result.split(",");
        if (arrData[0] == "OK") {
          callback(null, arrData[1]);
        } else {
          callback(arrData[1]);
        }
      }.bind(this), 2500);
    }.bind(this), 2000, message);
  },
  sendCmd: function (that, callback) {
    var cmd = "/var/opt/scripts/HomebridgeMitsubishi.py";
    var params = ["0", "22", "0", "0", "1"];

    //Default temperature and State
    var temperature = 22.0;
    var futureState = Characteristic.CurrentHeaterCoolerState.IDLE;

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
    params[2] = "0";
    if (that.RotationSpeed) {
      params[2] = that.RotationSpeed.toString();
    }
    //Vane:  0-auto, 1,2,3,4,5-angle, 6-moving)
    params[3] = "0";
    if (that.Swingmode == Characteristic.SwingMode.SWING_ENABLED) {
      params[3] = "6";
    }
    //Status: 0-off, 1-on
    params[4] = "1";
    if (that.Active == Characteristic.Active.INACTIVE) {
      params[4] = "0";
      futureState = Characteristic.CurrentHeaterCoolerState.INACTIVE;
    }
    //Send serial data
    var msg = "S," + params.join(",");
    this.serialSendCmd(msg, function (error, temperature) {
      if (error) {
        this.log("Serial command function failed:", error);
        callback(error);
      } else {
        this.log("Serial command function succedded");
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
    this.sendCmd(that, function (error, stdout, stderr) {
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
      callback();
    } else {
      this.log("setTargetHeaterCoolerState from/to:", this.TargetHeaterCoolerState, value);
      var that = this;
      that.TargetHeaterCoolerState = value;
      this.sendCmd(that, function (error, stdout, stderr) {
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
    var msg = "G";
    this.serialSendCmd(msg, function (error, temperature) {
      if (error) {
        this.log("Serial command function failed:", error);
        callback(error);
      } else {
        this.log("Serial command function succedded");
        this.CurrentTemperature = Math.round(temperature * 100) / 100;
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
      callback();
    } else {
      this.log("setSwingMode from/to:", this.SwingMode, value);
      var that = this;
      that.SwingMode = value;
      this.sendCmd(that, function (error, stdout, stderr) {
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
      callback();
    } else {
      this.log("setCoolingThresholdTemperature from/to:", this.CoolingThresholdTemperature, value);
      var that = this;
      that.CoolingThresholdTemperature = value;
      this.sendCmd(that, function (error, stdout, stderr) {
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
      callback();
    } else {
      this.log("setHeatingThresholdTemperature from/to:", this.HeatingThresholdTemperature, value);
      var that = this;
      that.HeatingThresholdTemperature = value;
      this.sendCmd(that, function (error, stdout, stderr) {
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
      callback();
    } else {
      this.log("setRotationSpeed from/to:", this.RotationSpeed, value);
      var that = this;
      that.RotationSpeed = value;
      this.sendCmd(that, function (error, stdout, stderr) {
        if (error) {
          callback(error);
        } else {
          this.RotationSpeed = value;
          callback(null);
        }
      }.bind(this));
    }
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

    //this.service
    //  .getCharacteristic(Characteristic.Swingmode)
    //  .on('get', this.getSwingmode.bind(this))
    //  .on('set', this.setSwingmode.bind(this));

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
        maxValue: 6,
        minStep: 1
      });

    return [informationService, this.service];
  }
};
