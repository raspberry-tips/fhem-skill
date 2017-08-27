'use strict';
//Erlaubt änderungen im laufenden Betrieb des App Servers
module.change_code = 1;

//Abhängige Module deklarieren
var _ = require('lodash');
var Alexa = require('alexa-app');
var app = new Alexa.app('fhem-skill');
var FHEMDataHelper = require('./fhem_data_helper');

//Start unseres Skills, wird immer zu erst aufgerufen falls keine Parameter angegeben werden
app.launch(function(req, res) {
  var prompt = 'Sage mir ein Gerät, den Standort und eine Aktion um dein Smart Home zu steuern.';
  res.say(prompt).reprompt(prompt).shouldEndSession(false);
});

//Unser Intent und die Slots definiert wie in der Alexa Konsole, Anhängend die Funktion zum Ausführen des Intent
app.intent('FHEMSmartHomeAction', {
 'slots': {
   //Jeweils Name und Typ unserer Slots
    'DeviceType': 'LIST_OF_DEVICE_TYPES',
    'DeviceLocation': 'LIST_OF_DEVICE_LOCATIONS',
    'DeviceActions': 'LIST_OF_DEVICE_ACTIONS'
  },
  //Der App Server generiert uns aus diesem speziellen Format alle Beispielsätze zu erkennung und zuordnung an unser intent
  //https://github.com/alexa-js/alexa-utterances
  'utterances': ['{|schalte|schalter} {-|DeviceType} {|in|im|an|für} {-|DeviceLocation} {-|DeviceActions} ']
},
  function(req, res) {
    //SLOTS HOLEN, diese werden von der Alexa aus der Cloud als String übergeben
    var _deviceType = req.slot('DeviceType');
    var _deviceLocation = req.slot('DeviceLocation');
    var _deviceActions = req.slot('DeviceActions');

    //Rückfrage falls ein Slot fehlt.
    var reprompt  = 'Sage mir ein Gerät, den Standort und eine Aktion um dein Smart Home zu steuern.';
    
    //Prüfen ob alle Slots übergeben wurden
    if (_.isEmpty(_deviceType)) {
        var prompt = 'Ich habe kein Gerät verstanden. Sage mir ein Gerät.';
        res.say(prompt).reprompt(reprompt).shouldEndSession(false);
        return true;
      } else if (_.isEmpty(_deviceLocation)) {
        var prompt = 'Ich habe keinen Standort des Geräts verstanden. Sage mir einen Standort.';
        res.say(prompt).reprompt(reprompt).shouldEndSession(false);
        return true;
      } else if (_.isEmpty(_deviceActions)) {
        var prompt = 'Ich habe kein Aktion verstanden. Sage mir an oder aus.';
        res.say(prompt).reprompt(reprompt).shouldEndSession(false);
        return true;
      } else {
        //Wenn alle Slots übergeben wurden rufen wir unsere FHEM Helfer Klasse auf und übergeben die Slots
        var fhemHelper = new FHEMDataHelper();

        fhemHelper.sendDeviceStatus(_deviceLocation, _deviceType, _deviceActions).then(
          function(fhemReturn) {
                //Fhem liefert bei erfolgreicher Akion keinen response.body, aber einen status.
                console.log('Befehl an Smart Home gesendet. Status ' + fhemReturn.statusCode);
                //Alles Okay Info senden
                res.say('Befehl an Smart Home gesendet. Status ' + fhemReturn.statusCode).send();
              }).catch(function(err) {
                console.log(err.statusCode);
                // Bei einem Fehler liefern wir den HTTP Status Code mit zurück
                var prompt = 'Fehler, ich konnte die Aktion  nicht durchführen. Status ' + err.statusCode;
                res.say(prompt).reprompt(reprompt).shouldEndSession(false).send();
              });
              return false;
    }
  }
);

//support custom utterances in utterance expansion string
var utterancesMethod = app.utterances;
app.utterances = function() {
  return utterancesMethod().replace(/\{\-\|/g, '{');
};

module.exports = app;