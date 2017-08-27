'use strict';

var _     = require('lodash');
var rp = require('request-promise');

// FHEM Variablen
// ==============
  // FHEMIpPort:
    // Tragt eure IP-Adresse und Port ein, alternative auch Hostname, wenn FHEM auf Port 80 läuft ist kein Port notwendig
  // FHEMCSRFToken:
    // Wichtig! Euer CSRF Token in Fhem muss fest eingestellt sein.
    // https://wiki.fhem.de/wiki/CsrfToken-HowTo   -> siehe: csrfToken festlegen
    // Übertrag euren Token dann hier und ersetzt 1768510152
  // FHEMDeviceSeperator:
    // Diesen Seperator verwenden ich um den Geräty Typ und den Standort zu Verbinden (z.B. Licht_Esstisch, Rolladen_Schlafzimmer)
    // Mein Namenschema für Geräte in FHEM ist immer <typ>_<standort>
// ############## hier editieren ###########
var FHEMIpPort          = '192.168.178.32:8083';
var FHEMCSRFToken       = '1768510152';
var FHEMDeviceSeperator = '_';
//##########################################
var FHEMUrl             = 'http://' + FHEMIpPort + '/fhem?XHR=1&cmd=set%20';
var FHEMUrlStatus       = 'http://' + FHEMIpPort + '/fhem?XHR=1&cmd=jsonlist2%20';


//Konstruktor
function FHEMDataHelper() { }

//Aufruf zum Abholen des Status via FHEM
FHEMDataHelper.prototype.sendDeviceStatus = function(deviceLocation, deviceType, deviceAction) {

  //Loggen der übergebenen Slots
  console.log('deviceLocation: ' + deviceLocation );
  console.log('deviceType: '  + deviceType);
  console.log('deviceAction: ' +  deviceAction);

  // Map der Actions an = on / aus = off oder auf off wenn unbekannt da FHEM an/aus nicht kennt, nur on/off oder 0/1
  if(deviceAction.toLowerCase() == 'an') { deviceAction = 'on'; }
  else if(deviceAction.toLowerCase() == 'aus') { deviceAction = 'off'; }
  else {deviceAction = 'off';}

  console.log('Mapped deviceAction: ' +  deviceAction);


  //Funktion für HTTP Aufruf
  return this.setDeviceStatus(deviceLocation, deviceType, deviceAction).then(
      function(response) {
        //Fhem liefert bei erfolgreicher Akion keinen response.body, wir geben ihn dennoch zurück.
          return response;
      }

  );
};

//Abholen des Status via FHEM Webinterface
FHEMDataHelper.prototype.setDeviceStatus = function(deviceLocation, deviceType, deviceAction) {

  //Wir bauen unseren Fhem Gerätenamen zusammen, bei mir immer Device Typ (z.B. Licht) _ Dervice Location (z.B. Esszimmer)
  var _fhemDevice = '' + deviceType + '' +  FHEMDeviceSeperator + '' + deviceLocation + '';
  
  //Wir bauen unsere FHEM URL für den Aufruf
  var _fhemURL = FHEMUrl + _fhemDevice + '%20' + deviceAction + '&fwcsrf=' + FHEMCSRFToken + '';
  console.log('FHEM URL: ' +  _fhemURL);

  //Optionen für unseren HTTP GET Request
  var options = {
    method: 'GET',
    uri: _fhemURL,
    resolveWithFullResponse: true,
    json: true
  };
  
  //Request ausführen und zurückgeben
  return rp(options);
};

module.exports = FHEMDataHelper;