//--------------------------------------
// jc://remote/language/
//--------------------------------------
// multi-language support (implementation just started)
//--------------------------------------
// language_app[LANG][<param>]
// add your app specific translations

let language_app = {
    "DE" : {
        "CONNECTION_ERROR"              : "Verbindungsfehler",
        "CONNECTION_DISABLED"           : "API deaktiviert",

        "EXECUTION_ERROR"               : "Konnte das Kommando &quot;{2}&quot; für {0} <b>{1}</b> nicht ausführen: <i>{3}</i>",
        "ERROR_LOST_LOCAL_NETWORK"      : "Aktuell besteht keine Verbindung vom Server ins lokale Netzwerk.",
        "ERROR_LOST_SERVER_CONNECT"     : "Aktuell besteht keine Verbindung von der App zum Server.",

        "RESET_SWITCH_OFF"              : "Reset Devices ohne API-Anbindung:<br/>vorher alle Geräte ausschalten.",
        "RESET_VOLUME_TO_ZERO"          : "Reset Audio Settings für Devices ohne API-Anbindung:<br/>vorher alle Receiver mit Audio auf Mininum (0) einstellen.",

        "POWER_DEVICE_OFF"              : "Schalte zuerst den Strom für das Gerät ein. {0}",
        "POWER_DEVICE_OFF_SCENE"        : "Schalte über den Toggle oben rechts den Strom für das Gerät ein. {0}",
        "POWER_DEVICE_OFF_SCENE_INFO"   : "<b>Strom ausgeschaltet:</b> Schalte den Strom für diese Szene über den Toggle oben rechts ein.",

        "PLEASE_WAIT"                   : "Bitte warten ... .",
        "MACRO_PLEASE_WAIT"             : "Führe ein paar Kommandos aus, bitte kurz warten.",

        "MENU_SHOW_HIDDEN_ON"           : "Mehr zeigen",
        "MENU_SHOW_HIDDEN_OFF"          : "Weniger zeigen",

        "STATUS_DEV_OK"                 : "Das Gerät <b>{0}</b> ist bereit.",
        "STATUS_DEV_N/A"                : "Der Status vom Gerät <b>{0}</b> ist unbekannt, ausprobieren!",
        "STATUS_DEV_POWER_OFF"          : "Der Strom ist ausgeschaltet: <b>{0}</b>",
        "STATUS_DEV_ERROR"              : "Beim Gerät <b>{0}</b> ist ein Fehler aufgetreten. {1}",
        "STATUS_DEV_API_DISABLED"       : "Die API <b>{0}</b> für das Gerät <b>{1}</b> ist deaktiviert.",
        "STATUS_DEV_API_STARTING"       : "Die API <b>{0}</b> für das Gerät <b>{1}</b> wird gerade gestartet, bitte warten.",
        "STATUS_DEV_API_ERROR"          : "Bei der API <b>{0}</b> für das angeschlossene Gerät <b>{1}</b> ist ein Fehler aufgetreten: <i>{2}</i>",
        "STATUS_DEV_OTHER_ERROR"        : "Es ist ein unbekannter Fehler beim Gerät <b>{0}</b> aufgetreten.",
        "STATUS_DEV_EMPTY"              : "Für dieses Gerät <b>{0}</b> wurde bislang noch keine Fernbedienung definiert.",

        "STATUS_SCENE_OK"               : "Die Szene <b>{0}</b> ist bereit.",
        "STATUS_DEV_OFF"                : "Alle Geräte der Szene <b>{0}</b> sind ausgeschaltet.",
        "STATUS_SCENE_STARTING"         : "Mindestens eine für die Szene <b>{0}</b> nötige API startet gerade, bitte warten.",
        "STATUS_SCENE_POWER_OFF"        : "Der Strom über für Szene <b>{0}</b> ist ausgeschaltet. Nutze <b>{1}</b> zum einschalten.",
        "STATUS_SCENE_PARTLY"           : "Für die Szene <b>{0}</b> sind noch nicht alle nötigen Geräte eingeschaltet: <i>{1}</i>. &quot;ON&quot; dr&uuml;cken, um fehlende zu starten.",
        "STATUS_SCENE_DISABLED"         : "Mindestens ein für die Szene <b>{0}</b> erforderliches Device ist deaktiviert: <i>{1}</i>",
        "STATUS_SCENE_ERROR"            : "Für mindestens eines der für die Szene <b>{0}</b> benötigten Geräte ist ein Fehler aufgetreten: <i>{1}</i>.",
        "STATUS_SCENE_EMPTY"            : "Für die Szene <b>{0}</b> wurde bislang noch keine Fernbedienung definiert.",

        "STATUS_SCENE_API_DISABLED"     : "Mindestens eine für die Szene <b>{0}</b> erforderliche API ist deaktiviert: <i>{1}</i>",
        "STATUS_SCENE_NO_DEVICES"       : "Es sind keine erforderlichen Geräte für die Szene <b>{0}</b> definiert.",

        "STATUS_GROUP_OK"                : "Die Gruppe <b>{0}</b> und die enthaltenen Geräte sind bereit.",
        "STATUS_GROUP_N/A"               : "Der Power-Status der Gruppe <b>{0}</b> ist nicht verfügbar. Bitte, ausprobieren.",
        "STATUS_GROUP_POWER_OFF"         : "Mindestens eines der in der Gruppe <b>{0}</b> enthaltenen Geräte ist ausgeschaltet: {1}.",
        "STATUS_GROUP_ERROR"             : "Für mindestens eines der in der Gruppe <b>{0}</b> enthaltenen Geräte ist ein Fehler aufgetreten: {1}",
        "STATUS_GROUP_API_DISABLED"      : "Die API <b>{0}</b> für <b>{1}</b> ist deaktiviert.",
        "STATUS_GROUP_API_STARTING"      : "Mindestens eine relevante API für <b>{0}</b> startet gerade, bitte warten.",
        "STATUS_GROUP_API_ERROR"         : "Für mindestens eine relevante API von <b>{1}</b> ist ein Fehler aufgetreten: <i>{2}</i>",
        "STATUS_GROUP_OTHER_ERROR"       : "Unbekannter Fehler für die Gruppe <b>{0}</b> aufgetreten.",
        "STATUS_GROUP_EMPTY"             : "Die Gruppe <b>{0}</b> enthält bislang keine Geräte.",

        "STATUS_NO_SERVER_CONNECT"      : "Aktuell besteht keine Verbindung zum Server.",
        "STATUS_SCENE_OFF"              : "Alle Geräte der Szene <b>{0}</b> sind ausgeschaltet.",

        "ADD_ELEMENTS"          : "Elemente hinzufügen",
        "ADD_DISPLAY"           : "Display hinzufügen",
        "ADD_SCENE"             : "Szene hinzufügen",
        "ADD_REMOTE"            : "Fernbedienung hinzufügen",
        "ADD_DEVICE"            : "Gerät hinzufügen",
        "ADD_LINE"              : "Einfache Linie hinzufügen",
        "ADD_EMPTY"             : "Leeres Feld hinzufügen",

        "AUDIO_IS_MAIN"         : "Dieses Gerät ist als AUDIO-Hauptgerät definiert.",
        "AUDIO_SET_AS_MAIN"     : "Als AUDIO-Hauptgerät festlegen (wechseln von &quot;{0}&quot;).",
        "AUDIO_N/A_AS_MAIN"     : "Dieses Gerät kann nicht als AUDIO-Hauptgerät genutzt werden, keine Lautstärkeregelung verfügbar. (Es ist kein Schlüssel 'vol' oder 'volume' in den Gerätebefehlen definiert.)",

        "API"                   : "API",
        "API_ADMIN"             : "API-Verwaltung",
        "API_CREATE_CONFIG"     : "API-Konfiguration erstellen",
        "API_CREATE_DEV_CONFIG" : "Gerätekonfiguration erstellen",
        "API_CREATE_CONFIG_INFO" : "Erstelle eine vollständige <b>API-Konfiguration</b> für alle erkannten API-Geräte, die als ./data/devices/{0}/00_interface.json gespeichert wird. " +
                                   "Die 'API-Geräte' werden auf Basis der Standard-API-Definitionen erstellt. Passe Werte wie 'PowerDevice' an deine Bedürfnisse an. " +
                                   "Wird ein neues Gerät nicht erkannt, trenne die API-Verbindung, warte einige Minuten und versuche es erneut.",
        "API_CREATE_DEV_CONFIG_INFO" : "Erstelle eine <b>Gerätekonfigurationsdatei</b> für ein Gerät aus seiner Konfiguration und speichere diese im Ordner ./data/devices/{0}/&lt;device_name&gt;.json. " +
                                   "Du kannst Schlüsselnamen für Tasten und Befehle sowie den Abfragebereich anpassen. " +
                                   "Wähle diese Datei als Gerätekonfiguration beim Erstellen einer neuen Fernbedienung für ein Gerät aus.",
        "API_DEVICE"            : "API-Device",
        "API_DEFINITION"        : "API-Definition",
        "API_INTERFACE"         : "API / API-Device",
        "API_CONNECTION"        : "API-Verbindung",
        "API_COMMANDS"          : "API-Befehle",
        "API_COMMANDS_TEST"     : "API-Befehle - manueller Test",
        "API_DEVICE_DELETE"     : "Möchtest du das Gerät <b>{1}</b> wirklich aus der <b>API {0}</b> löschen?",
        "API_DEVICE_DISCOVERY"  : "Soll jetzt eine API-Geräteerkennung gestartet werden? Dies dauert einige Minuten und kann den Server vorübergehend verlangsamen.",
        "API_DEVICE_CONFIG_NA"  : "<b>FEHLER:</b> Es ist keine API-Konfiguration verfügbar oder sie ist beschädigt. Überprüfe die Datendateien oder verwende eine Kopie aus den Beispieldaten (<u>data/_sample/devices/*/00_interface.json</u>).",
        "API_RECONNECT_ALL"     : "Sollen jetzt alle Geräte neu verbunden werden?",
        "API_INFORMATION"       : "API-Informationen",
        "API_SELECT_CMD"        : "API-Befehl oder eigenen eingeben ...",
        "API_INFO"              : "API-Info",
        "API_DEVICE_NOT_CONNECTED"   : "API-Gerät {0} nicht verbunden",
        "API_NOT_CONNECTED"          : "API {1} nicht verbunden",
        "API_SETTINGS"          : "API-Einstellungen",
        "API_SETTINGS_OVERVIEW" : "API-Übersicht",
        "API_TEST"              : "API-Test",

        "API_EDIT_REALLY_CHANGE": "Möchtest du die <b>API-Einstellungen</b> für diese Fernbedienung wirklich ändern?",
        "API_EDIT_SELECT_API_CONFIG": "Bitte wähle eine <b>API-Konfigurationsdatei</b> aus",
        "API_EDIT_SELECT_API_DEVICE": "Bitte wähle eine <b>Gerätekonfigurationsdatei</b> aus",
        "API_EDIT_SELECT_REMOTE": "Bitte wähle eine <b>Fernbedienungskonfigurationsdatei</b> aus",

        "BUTTON_ASK_DELETE"     : "Möchtest du die Taste '{0}_{1}' aus '{2}' wirklich löschen?",
        "BUTTON_ASK_DELETE_NUMBER" : "Möchtest du die Taste Nummer [{0}] aus '{1}' wirklich löschen?",
        "BUTTON_INSERT_NAME"    : "Bitte gib einen Namen für die Taste ein.",
        "BUTTON_RECORD"         : "Taste &quot;{0}&quot; für Gerät &quot;{1}&quot; aufnehmen: Klicke auf OK und drücke dann innerhalb der nächsten 5 Sekunden die entsprechende Taste auf deiner Fernbedienung.",
        "BUTTON_SELECT"         : "Bitte wähle eine Taste aus.",
        "BUTTON_INFOS"          : "Tasteninformationen",
        "BUTTON_IMAGE_DEFAULT"  : "Standard-Tastenbild",

        "BUTTON_T"              : "BUtton",
        "BUTTON_T_ADD"          : "hinzufügen",
        "BUTTON_T_CLONE"        : "klonen",
        "BUTTON_T_COLOR_PICKER" : "Farbauswahl",
        "BUTTON_T_COLOR"        : "Farbmodell",
        "BUTTON_T_CREATE"       : "erstellen",
        "BUTTON_T_DEL"          : "Button löschen",
        "BUTTON_T_DELETE"       : "löschen",
        "BUTTON_T_DEL_VALUE"    : "Wert löschen",
        "BUTTON_T_DESCRIPTION"  : "Beschreibung",
        "BUTTON_T_DEVICE"       : "Device",
        "BUTTON_T_DISPLAY"      : "Display hinzufügen",
        "BUTTON_T_DISPLAY_VALUE": "Anzeigewert",
        "BUTTON_T_EMPTY"        : "leeres Feld",
        "BUTTON_T_HEADER"       : "Kopfzeilenbild",
        "BUTTON_T_KEYBOARD"     : "Tastatur",
        "BUTTON_T_LINE"         : "Linie",
        "BUTTON_T_LINE_TEXT"    : "Linie mit Text",
        "BUTTON_T_MINMAX"       : "Min-Max",
        "BUTTON_T_MOVE2REMOTE"  : "zur Fernbedienung verschieben",
        "BUTTON_T_PREVEW"       : "Vorschau",
        "BUTTON_T_RESET"        : "zurücksetzen",
        "BUTTON_T_SAVE"         : "speichern",
        "BUTTON_T_STOP_EDIT"    : "Bearbeitung beenden",
        "BUTTON_T_SEND"         : "Befehl senden",
        "BUTTON_T_SHOW_HIDE"    : "ein-/ausblenden",
        "BUTTON_T_SLIDER"       : "Schieberegler",
        "BUTTON_T_TEMPLATE"     : "Vorlage",
        "BUTTON_T_OTHER"        : "andere Taste",
        "BUTTON_T_PARAMETER"    : "Parameter",
        "BUTTON_T_PREVIEW"      : "Vorschau",
        "BUTTON_T_VALUE"        : "Wert hinzufügen",
        "BUTTON_T_TRY"          : "ausprobieren",
        "BUTTON"                : "Button",
        "BUTTONS"               : "Buttons",

        "CHANNEL_USE_JSON"      : "Bitte verwende JSON zum Bearbeiten der Kanalliste.",
        "CHANGE_ORDER"          : "Reihenfolge der Fernbedienungen ändern",
        "CHANGE_ORDER_SCENES"   : "Reihenfolge der Szenen ändern",
        "CHANGE_ORDER_DEVICES"  : "Reihenfolge der Geräte ändern",
        "CHANGE_MODES"          : "Arbeitsmodi ändern",
        "CHANNEL"               : "Kanal",

        "CHART"                 : "Diagramm",
        "CHART_EXISTS"          : "Es gibt bereits einen Diagrammbereich in dieser Fernbedienung.",
        "CHART_NO_ENTRIES"      : "Keine Einträge vorhanden.",
        "CHART_ERROR_LOADING_CHART_JS": "Fehler: Chart.js konnte nicht geladen werden.",
        "CHART_LOADING"         : "Diagrammdaten werden geladen ...",
        "CHART_VALUE_EXISTS"    : "Wert existiert bereits.",
        "CHART_VALUE_DOESNT_EXISTS" : "Wert existiert nicht.",
        "CHART_VALUE_SELECT"    : "Zuerst einen Diagrammwert auswählen.",

        "CONNECTION_POWER_OFF"  : "Strom aus",
        "CONNECTION_DEVICE_OFF" : "Gerät aus",
        "CONNECTION_MANUAL"     : "Manueller Modus",
        "CONNECTED"             : "verbunden",
        "CONNECTED_DEVICES"     : "verbundene Geräte",
        "CONNECTED_RMC"         : "verbundene Fernbedienungen",
        "DETECTED_DEVICES"      : "erkannte Geräte",

        "COLOR_PICKER_SELECT_CMD": "Befehl auswählen, um Farbauswahl einzufügen.",
        "COLOR_PICKER_SELECT_MODEL": "Farbmodell auswählen, um Farbauswahl einzufügen.",
        "COLOR_PICKER_N/A"      : "Farbauswahl nicht unterstützt",
        "COLOR_PICKER"          : "Farbauswahl",

        "CONFIG_INTERFACE"      : "Schnittstellen-Konfiguration",
        "CONFIG_API"            : "Konfigurationsdatei <u>API</u>",
        "CONFIG_REMOTE"         : "Konfigurationsdatei <u>Fernbedienung</u>",
        "CONFIG_DEVICE"         : "Konfigurationsdatei <u>Gerät</u>",
        "COMMANDS"              : "Befehle",

        "COMMAND_DELETE_INFO"   : "Nach dem Löschen kann ein Befehl für eine Taste erneut aufgenommen werden.",
        "COMMAND_RECORD_INFO"   : "Nicht definierte Tasten sind blau markiert. Klicken zum Aufnehmen eines IR-Befehls für diese Tasten.",
        "COPY"                  : "kopieren",
        "COPIED_TO_CLIPBOARD"   : "Inhalt in die Zwischenablage kopiert.",
        "CREATE"                : "erstellen",

        "DESCRIPTION"           : "Beschreibung",

        "DELETE"                : "löschen",
        "DELETE_ELEMENTS"       : "Elemente löschen",
        "DELETE_COMMAND"        : "Befehl löschen",

        "DEVICE"                    : "Gerät",
        "DEVICE_ASK_DELETE"         : "Möchtest du das Gerät '{0}' wirklich löschen?",
        "DEVICE_DONT_EXISTS"        : "Gerät '{0}' existiert nicht!",
        "DEVICE_EXISTS"             : "Gerät '{0}' existiert bereits!",
        "DEVICE_INSERT_ID"          : "Bitte gib eine ID für das Gerät ein (keine Sonderzeichen).",
        "DEVICE_INSERT_LABEL"       : "Bitte gib eine Bezeichnung für das Gerät ein.",
        "DEVICE_INSERT_NAME"        : "Bitte gib den Namen des Geräts ein.",
        "DEVICE_SELECT"             : "Bitte wähle ein Gerät aus.",
        "DEVICE_SELECT_API"         : "Bitte wähle eine API für das Device aus.",
        "DEVICE_SELECT_TEMPLATE"    : "Bitte wähle eine Vorlage für die Fernbedienung aus.",
        "DEVICE_SELECT_VISIBILITY"  : "Bitte wähle aus, ob das Device sichtbar oder ausgeblendet sein soll.",
        "DEVICES"                   : "Devices",
        "DEVICES_NOT_CONNECTED"     : "Devices nicht verbunden",
        "DEVICES_NOT_DEFINED_YET"   : "Noch keine Devices definiert.",
        "DEVICES_ADD_SETTINGS"      : "Verwende die Einstellungen, um Fernbedienungen zu erstellen.",

        "DISCOVERY_DONE"                : "OK: Erkennung von API-Devices abgeschlossen.",
        "DISCOVERY_FAILED"              : "FEHLER: Erkennung von API-Devices fehlgeschlagen.",

        "DISPLAY"                       : "Display",
        "DISPLAY_EXISTS"                : "Es gibt bereits ein Display in dieser Fernbedienung.",
        "DISPLAY_LABEL_SELECT"          : "Zu löschendes Label im Display auswählen.",
        "DISPLAY_LABEL_DONT_EXIST"      : "Das ausgewählte Label existiert nicht in der Display-Definition.",
        "DISPLAY_VALUE_SELECT"          : "Gerät und Wert auswählen, der im Display angezeigt werden soll.",
        "DISPLAY_LABEL_ADD"             : "Label für den zusätzlichen Wert im Display eingeben.",
        "DISPLAY_LABEL_EXISTS_ALREADY"  : "Label existiert bereits im Display.",
        "DISPLAY_NOT_ADDED"             : "Noch kein Display hinzugefügt. Änderungen unten haben keine Auswirkung.",

        "EDIT"                   : "bearbeiten",
        "EDIT_ADD_DISPLAY"       : "Display hinzufügen und bearbeiten",
        "EDIT_DEVICE"            : "Device bearbeiten",
        "EDIT_DEVICES"           : "Devices bearbeiten",
        "EDIT_ARCHIVED_DEVICES"  : "Archivierte Devices verwalten",
        "EDIT_DISPLAY"           : "Display bearbeiten",
        "EDIT_ELEMENTS"          : "Elemente bearbeiten",
        "EDIT_JSON"              : "JSON bearbeiten",
        "EDIT_INTERFACES"        : "Schnittstellen bearbeiten",
        "EDIT_INTERFACE"         : "Schnittstellenkonfiguration bearbeiten für {0}",
        "EDIT_MACROS"            : "Makros bearbeiten",
        "EDIT_REMOTE"            : "Fernbedienung bearbeiten",
        "EDIT_REMOTES"           : "Fernbedienungen bearbeiten",
        "EDIT_SCENE"             : "Szene bearbeiten",
        "EDIT_SCENES"            : "Szenen bearbeiten",
        "EDIT_ARCHIVED_SCENES"   : "Archivierte Szenen verwalten",
        "EDIT_RECORDINGS"        : "Aufnahmen bearbeiten",
        "EDIT_RECORDING_SETTINGS": "Allgemeine Einstellungen bearbeiten",
        "EDIT_RECORDED_FIELDS"   : "Aufzuzeichnende Werte bearbeiten",

        "EXTERNAL_ID"            : "Externe ID",
        "ERROR_UNKNOWN"          : "Unbekannter Fehler",
        "ERROR_THREAD_TOO_LONG"  : "Der Thread <b>{0}</b> hat für <b>{1}s</b> nicht geantwortet.",
        "FORMAT_INCORRECT"       : "Format ist nicht korrekt",
        "FAVICON_INFO"           : "Wähle ein anderes Favicon oder Apple-Icon. <i>Hinweis:</i> Diese Auswahl ist momentan nur temporär – wähle die WebApp und speichere sie auf dem Home-Screen, um ein bestimmtes Apple-Icon zu verwenden.",

        "GET_DATA"               : "Daten abrufen",
        "GET_AVAILABLE_COMMANDS" : "Befehle auflisten",

        "HEADER"                : "Kopfzeile",
        "HEADER_IMAGE_EXISTS"   : "Es gibt bereits ein KOPFZEILEN-BILD in dieser Fernbedienung.",

        "ID"                    : "ID",
        "IMAGE"                 : "Bild",
        "INFO"                  : "Info",
        "INTERFACES"            : "Schnittstellen",
        "INTERFACE_STATUS"      : "Schnittstellenstatus",

        "JSON_EDIT"             : "JSON-Daten bearbeiten",
        "JSON_CHANNEL"          : "JSON-Kanal-Makros",
        "JSON_DISPLAY"          : "JSON-Display-Informationen",
        "JSON_DEVICE"           : "JSON erforderliche Devices",
        "JSON_REMOTE"           : "JSON Fernbedienung",
        "JSON_SCENE_MACROS"     : "JSON Szenen-Makros",
        "JSON_DEVICE_MACROS"    : "JSON Device-Makros",
        "JSON_REMOTE_MACROS"    : "JSON Makros (EIN|AUS)",

        "JSON_REQUIRED_DEVICES"        : "Erforderliche Devices",
        "JSON_EDIT_RMC_DEFINITION"     : "Fernbedienung bearbeiten",
        "JSON_EDIT_DISPLAY_DEFINITION" : "Display-Definition bearbeiten",
        "JSON_EDIT_CHANNEL_MACROS"     : "Kanal-Makros bearbeiten",
        "JSON_EDIT_MACRO_SCENE"        : "Makros SZENE bearbeiten",
        "JSON_EDIT_MACRO_SCENE_OTHER"  : "Szenen-Makros bearbeiten",

        "LABEL"                 : "Label",

        "LOAD_TEMPLATE"         : "Vorlage laden",
        "LOADING_APP"           : "App wird geladen ...",

        "MACRO"                 : "Makro",
        "MACROS"                : "Makros",
        "MACRO_DEVICE_EDIT"     : "<p>Nur zur Information; Makros in den <u style='cursor:pointer;' onclick='rmSettings.create(\\\"edit_scenes\\\");'>Szeneneinstellungen</u> bearbeiten ...<br/></p>",
        "MACRO_EMPTY"           : "FEHLER: Dieser Button von &quot;{0}&quot; enthält ein leeres Makro.",

        "MACRO_EDIT_TIMING"     : "Warten [s]",
        "MACRO_EDIT_WAITING"    : "Wartemeldung [s]",

        "MAIN"                  : "Haupt",
        "MAIN_SETTINGS"         : "Haupteinstellungen",
        "MANUAL"                : "manuell",

        "MANUAL_ADD_ELEMENTS"   : "<h4>Elemente hinzufügen</h4><p>Hier können verschiedene neue Elemente zur Fernbedienung hinzugefügt werden. Alle neuen Elemente werden am Ende der Fernbedienung eingefügt und können mit dem Tooltip nach oben verschoben werden.</p>",
        "MANUAL_ADD_TEMPLATE"   : "<h4>Vorlage laden</h4><p>Durch das Laden einer Vorlage wird die vorhandene Fernbedienungsdefinition überschrieben.</p>",
        "MANUAL_ADD_API-DEVICE" : "Wähle ein erkanntes <b>API-Gerät</b> aus der Liste oder wähle &quot;ANDERE&quot;, um eine IPv4-Adresse manuell einzugeben. " +
                                  "Falls das erwartete Gerät nicht in der Liste ist, stelle sicher, dass das API-Gerät eingeschaltet ist, und versuche es in einigen Minuten erneut.",

        "MANUAL_CHANNEL"        : "<i>Kanäle bearbeiten:</i><br/><br/><ul class='help'>" +
                                  "<li>Dict für die Kanaldefinition im JSON-Format befüllen: " +
                                  "<i>&quot;Kanalname&quot; : [ &quot;Taste&quot;, &quot;Taste&quot;, &quot;Makro&quot;]</i></li>" +
                                  "<li>Verwende &quot;&lt;device_id&gt;_&lt;button&gt;&quot; oder &quot;&lt;macro_type&gt;_&lt;button&gt;&quot; zur Definition von Tasten im Kanal-Makro; Makrotypen: macro, scene-on, scene-off, dev-on, dev-off</li>" +
                                  "</ul>",
        "MANUAL_DEVICES"        : "<i>Devices für Szene bearbeiten</i><br/><br/><ul class='help'>" +
                                  "<li>Array der enthaltenen Devices im JSON-Format befüllen: [&quot;device_id&quot;,&quot;device_id&quot;]</i>.</li>" +
                                  "</ul>",
        "MANUAL_DISPLAY"        : "<i>Display-Definition bearbeiten</i><br/><br/><ul class='help'>" +
                                  "<li>Dict für die Display-Definition im JSON-Format befüllen: <i>&quot;Label&quot; : &quot;feld_vom_gerät&quot;</i>.</li>" +
                                  "<li>Falls &quot;auto_off&quot; für das Gerät definiert ist (JSON-Datei prüfen), verwende &quot;auto-power-off&quot; als Feld, um die verbleibende Zeit bis zum automatischen Ausschalten anzuzeigen.</li>" +
                                  "</ul>",
        "MANUAL_REMOTE"         : "<i>Device-Fernbedienung bearbeiten:</i><br/><br/><ul class='help'>" +
                                  "<li>Array von Tastennamen im JSON-Format befüllen, vier Tasten pro Zeile.</li>" +
                                  "<li>&quot;LINE&quot; hinzufügen für eine horizontale Linie und &quot;LINE||Beschreibung&quot; für eine Linie mit Text.</li>" +
                                  "<li>&quot;DISPLAY&quot; hinzufügen, um ein Display mit Statusinformationen einzufügen (Details unten definiert).</li>" +
                                  "<li>&quot;SLIDER||send-&lt;command&gt;||&lt;Beschreibung&gt;||&lt;min&gt;-&lt;max&gt;||&lt;parameter&gt;&quot; hinzufügen, um einen Schieberegler einzufügen.</li>" +
                                  "<li>&quot;COLOR-PICKER||send-&lt;command&gt;&quot; hinzufügen, um ein Farbauswahl-Element einzufügen.</li>" +
                                  "<li>&quot;.&quot; hinzufügen, um ein leeres Feld einzufügen.</li>" +
                                  "</ul>",
        "MANUAL_SCENE"          : "<i>Szenen-Fernbedienung bearbeiten:</i><br/><br/><ul class='help'>" +
                                  "<li>Array von Tastennamen im JSON-Format befüllen, vier Tasten pro Zeile.</li>" +
                                  "<li>Verwende &quot;&lt;device_id&gt;_&lt;button&gt;&quot; oder &quot;&lt;macro_type&gt;_&lt;button&gt;&quot; zur Definition von Tasten; Makrotypen: macro, scene-on, scene-off, dev-on, dev-off</li>" +
                                  "<li>&quot;.&quot; hinzufügen, um ein leeres Feld einzufügen.</li>" +
                                  "<li>&quot;LINE&quot; hinzufügen für eine horizontale Linie und &quot;LINE||Beschreibung&quot; für eine Linie mit Text.</li>" +
                                  "<li>&quot;HEADER-IMAGE&quot; hinzufügen, um ein Bild einzufügen. Das Bild kann in den Szeneneinstellungen ausgewählt werden.</li>" +
                                  "<li>&quot;TOGGLE||&lt;gerät&gt;_&lt;wert&gt;||&lt;Beschreibung&gt;||&lt;befehl_ein&gt;||&lt;befehl_aus&gt;&quot; hinzufügen, um einen Schalter einzufügen." +
                                  " Unterstützt nur Werte mit EIN|AUS oder WAHR|FALSCH." +
                                  " Soll der Schalter in das Kopfzeilenbild integriert werden, direkt unterhalb von &quot;HEADER-IMAGE&quot; platzieren und &quot;HEADER-IMAGE||toggle&quot; verwenden.</li>" +
                                  "<li>&quot;SLIDER||send-&lt;wert&gt;||&lt;Beschreibung&gt;||&lt;von&gt;-&lt;bis&gt;||&lt;wert&gt;&quot; hinzufügen, um einen Schieberegler einzufügen." +
                                  " Unterstützt Geräte mit Abfragemodus, bei denen eine Zahl per API gesendet werden kann." +
                                  "</ul>",
        "MANUAL_MACROS"            : "<h4>Makros bearbeiten:</h4><ul class='help'>" +
                                  "<li>Hier können Makros im JSON-Format definiert werden. Makros können aus Tasten beliebiger definierter Fernbedienungen und ganzen Zahlen für Wartezeiten in Sekunden bestehen.</li>" +
                                  "<li><i>Wichtig:</i> Beim Speichern erfolgt eine generische Prüfung des JSON-Formats. Bitte sicherstellen, dass die erforderliche Datenstruktur wie unten beschrieben verwendet wird.</li>" +
                                  "<li><u>Gruppen (Implementierung in Bearbeitung)</u>: fasst mehrere ähnliche Geräte zu einer Gruppe zusammen, um die gleichen Tasten oder Befehle für alle Geräte gleichzeitig zu verwenden." +
                                  "<br/><i>-&gt; Format:</i> \\\"&lt;gruppe_id&gt;\\\" : {\\\"description\\\": \\\"&lt;Beschreibung&gt;\\\", \\\"devices\\\": [\\\"&lt;gerät_01&gt;\\\",\\\"&lt;gerät_02&gt;\\\"]} </li>" +
                                  "<li>Gruppen können in allen Szenen (nicht in Geräten) verwendet werden: 'group_&lt;button&gt;'.</li>" +
                                  "<li><u>Makrotyp DEV-ON</u>: Makros zum Ein-/Ausschalten eines Geräts, z.B. einschalten und Lautstärke setzen (auch in den jeweiligen Geräteeinstellungen bearbeitbar)." +
                                  "<br/><i>-&gt; Format:</i>  \\\"&lt;gerät&gt;\\\" : [\\\"&lt;gerät&gt;_&lt;taste&gt;\\\", 2, \\\"&lt;gerät&gt;_&lt;taste&gt;||&lt;wert&gt;\\\",] </li>" +
                                  "<li><u>Makrotyp DEV-OFF</u>: Makros zum Ausschalten eines Geräts (auch in den jeweiligen Geräteeinstellungen bearbeitbar)." +
                                  "<br/><i>-&gt; Format:</i>  \\\"&lt;gerät&gt;\\\" : [\\\"&lt;gerät&gt;_&lt;taste&gt;\\\", 2, \\\"&lt;gerät&gt;_&lt;taste&gt;||&lt;wert&gt;\\\",] </li>" +
                                  "<li><u>Globale Makros</u>: alle anderen Makros." +
                                  "<br/><i>-&gt; Format:</i> \\\"&lt;makro&gt;\\\" : [\\\"&lt;gerät&gt;_&lt;taste&gt;||&lt;wert&gt;\\\", 2, \\\"dev-on_&lt;gerät&gt;\\\"] </li>" +
                                  "<li>Makros können in allen Szenen (nicht in Geräten) verwendet werden: 'macro_&lt;makro&gt;', 'dev-on_&lt;gerät&gt;', 'dev-off_&lt;gerät&gt;'. Hinweis: Ist in der Szene ein Makro mit gleichem Namen definiert, wird das Szenen-Makro verwendet.</li>" +
                                  "<li>Mit &quot;MSG-xx&quot; am Anfang eines Makros wird eine Meldung angezeigt, dass xx Sekunden gewartet werden muss.</li>" +
                                  "<li>Für Geräte ohne API (method=record) z.B. \\\"&lt;taste&gt;||set-&lt;wert&gt;\\\" verwenden, um einen Wert zu setzen ohne den Befehl zu senden. Nützlich bei WLAN-Steckdosen, wenn ein Gerät immer im Modus \\\"EIN\\\" startet.</li>" +
                                  "</ul>",
        "MANUAL_MACROS_SCENE"   : "<i>Makros für diese Szene bearbeiten:</i><br/><br/><ul class='help'>" +
                                  "<li>Makros im JSON-Format definieren. Tasten beliebiger Geräte, globale Makros und Wartezeiten in Sekunden kombinieren.</li>" +
                                  "<li><u>Makrotyp SZENE EIN</u>: Hier alle Tasten/Befehle eintragen, um alle Geräte dieser Szene einzuschalten, Eingangskanäle zu setzen usw. Als \\\"scene-on\\\" in der Fernbedienungsdefinition verwenden." +
                                  "<br/><i>-&gt; Format:</i> [\\\"&lt;gerät&gt;_&lt;taste&gt;\\\", 2, \\\"dev-on_&lt;gerät&gt;\\\"] </li>" +
                                  "<li><u>Makrotyp SZENE AUS</u>: Hier alle Tasten/Befehle eintragen, um alle Geräte dieser Szene auszuschalten. Als \\\"scene-off\\\" in der Fernbedienungsdefinition verwenden." +
                                  "<br/><i>-&gt; Format:</i> [\\\"&lt;gerät&gt;_&lt;taste&gt;\\\", 2, \\\"dev-on_&lt;gerät&gt;\\\"] </li>" +
                                  "<li><u>Andere Szenen-Makros</u>: Hier weitere Tasten/Befehle für ein weiteres Makro dieser Szene eintragen." +
                                  "<br/><i>-&gt; Format:</i> {\\\"&lt;makro_name&gt;\\\" : [\\\"&lt;gerät&gt;_&lt;taste&gt;\\\", 2, \\\"dev-on_&lt;gerät&gt;\\\"]}</li>" +
                                  "<li>Den Befehl &quot;MSG-xx&quot; in einem Makro verwenden, um eine Meldung anzuzeigen, dass xx Sekunden gewartet werden muss.</li>" +
                                  "<li>Für Geräte ohne API (method=record) z.B. \\\"&lt;taste&gt;||set-&lt;wert&gt;\\\" verwenden, um einen Wert zu setzen ohne den Befehl zu senden. Nützlich bei WLAN-Steckdosen, wenn ein Gerät immer im Modus \\\"EIN\\\" startet.</li>" +
                                  "</ul>",

        "METHOD"                : "Methode",
        "MISSING_DATA"          : "Daten fehlen für '{0}'.<br/>Überprüfe die Dateien '{1}' und '{2}' im Datenverzeichnis.",
        "MISSING_DATA_SCENE"    : "Daten fehlen für '{0}'.<br/>Überprüfe die Datei '{1}' im Datenverzeichnis.",

        "MODE_SHOW_BUTTON"      : "Button-Code anzeigen",
        "MODE_EDIT"             : "Bearbeitungsmodus",
        "MODE_INTELLIGENT"      : "Intelligenter Modus",
        "MODE_MANUAL"           : "Manueller Modus",
        "MODE_EASY_EDIT"        : "Einfache Bearbeitung",
        "MODE_JSON_HIGHLIGHT"   : "JSON-Hervorhebung",
        "MODE_HINT"             : "Hinweise für Fernbedienungen anzeigen (nicht nur Fehler)",

        "MSG_ONLY_ONE_COLOR_PICKER"    : "Diese Farbauswahl existiert bereits in der Fernbedienung, nur eine ist möglich.",

        "NOT_USED"                     : "nicht in Fernbedienung verwendet",
        "NO_DEVICE_CONNECTED"          : "kein Gerät verbunden",
        "NO_REMOTE_CONNECTED"          : "keine Fernbedienung verbunden",
        "NO_HEADER_DEFINED"            : "Noch kein Kopfzeilenbild ausgewählt, in den Szeneneinstellungen bearbeiten.",

        "OFFLINE"                      : "Offline",

        "PREVIEW"                      : "Vorschau",

        "QUICK_ACCESS"                 : "Schnellzugriff",

        "RECONNECT"                    : "neu verbinden",
        "RECONNECT_DONE"               : "OK: Neuverbindung abgeschlossen ({0}).",
        "RECONNECT_FAILED"             : "FEHLER: Neuverbindung fehlgeschlagen ({0}).",

        "RECORD_COMMAND"               : "Befehl aufnehmen",
        "RECORD_DELETE_COMMANDS"       : "Befehle aufnehmen oder löschen",
        "REMOTE"                       : "Fernbedienung",
        "REMOTE_ADD"                   : "Fernbedienungen hinzufügen",
        "REMOTE_CONFIG_ERROR"          : "Fehler in der Fernbedienungskonfigurationsdatei(en) '{0}': ",
        "REMOTE_CONFIG_ERROR_UNKNOWN"  : "Unbekannter Fehler in der Fernbedienungskonfigurationsdatei(en) '{0}'",
        "RELOAD_TAKES_LONGER"          : "Das Laden dauert länger als erwartet ...",
        "RELOAD_TAKES_MUCH_LONGER"     : "Das Laden dauert viel länger als erwartet ...",
        "RESTART"                      : "Bist du sicher, dass du den Server neu starten möchtest?",
        "RELOAD_ALL_SCRIPTS"           : "Alle CSS- und JavaScript-Dateien neu laden.",
        "REMOTE_MOVE_TO_ARCHIVE"       : "Möchtest du die {0} Fernbedienung <b>{1}</b> ins Archiv verschieben?",
        "REMOTE_RESTORE_FROM_ARCHIVE"  : "Möchtest du die {0} Fernbedienung <b>{1}</b> aus dem Archiv wiederherstellen?",

        "SAVE"                         : "Speichern",

        "SCENE"                        : "Szene",
        "SCENE_STATUS"                 : "Szenenstatus",
        "SCENE_CONFIG_ERROR"           : "Fehler in der Szenenkonfigurationsdatei(en) '{0}': ",
        "SCENE_CONFIG_ERROR_UNKNOWN"   : "Unbekannter Fehler in der Szenenkonfigurationsdatei(en) '{0}'",

        "SCENE_ASK_DELETE"             : "Möchtest du die Szene '{0}' wirklich löschen?",
        "SCENE_EXISTS"                 : "Szene '{0}' existiert bereits!",
        "SCENE_IMAGE"                  : "Szenenbild",
        "SCENE_INSERT_ID"              : "Bitte gib eine ID für die Szene ein (keine Sonderzeichen).",
        "SCENE_INSERT_LABEL"           : "Bitte gib eine Bezeichnung für die Szene ein.",
        "SCENE_SELECT"                 : "Bitte wähle eine Szene aus.",
        "SCENES_NOT_DEFINED_YET"       : "Noch keine Szenen definiert.",

        "SEND_DATA"                    : "Daten senden",
        "SELECT"                       : "Auswählen",
        "SELECT_DEV_MACRO"             : "Device oder Makro auswählen",
        "SELECT_DEV_FIRST"             : "zuerst Device auswählen",
        "SELECT_DEV_TYPE_FIRST"        : "zuerst Device-Typ auswählen",
        "SELECT_API_FIRST"             : "zuerst Schnittstelle auswählen",
        "SERVER_SETTINGS"              : "Server- &amp; Client-Einstellungen",
        "SETTINGS"                     : "Einstellungen",
        "SETTINGS_GENERAL"             : "Allgemeine Einstellungen",
        "SETTINGS_REMOTE"              : "Fernbedienungseinstellungen",
        "SETTINGS_DEVICES"             : "Device-Einstellungen",
        "SETTINGS_API"                 : "API-Einstellungen",
        "SETTINGS_MACROS"              : "Globale Makros &amp; Gruppen",
        "SETTINGS_SCENES"              : "Szeneneinstellungen",
        "SETTINGS_TIMER"               : "Timer-Einstellungen",
        "SETTINGS_RECORDINGS"          : "Aufnahmeeinstellungen",

        "SLIDER"                       : "Schieberegler",
        "SLIDER_SELECT_CMD"            : "Befehl auswählen, um Schieberegler einzufügen.",
        "SLIDER_SELECT_PARAM"          : "Parameter auswählen, um Schieberegler einzufügen.",
        "SLIDER_INSERT_DESCR"          : "Beschreibung eingeben, um Schieberegler einzufügen.",
        "SLIDER_INSERT_MINMAX"         : "Mindest- und Höchstwert eingeben (min-max), um Schieberegler einzufügen.",
        "SLIDER_N/A"                   : "Schieberegler nicht unterstützt",

        "TEXT_INPUT"                   : "Texteingabe",
        "TEMPLATE"                     : "Vorlage",
        "TEMPLATE_OVERWRITE"           : "Möchtest du die Tasten von '{0}' wirklich mit der Vorlage '{1}' überschreiben?",
        "TEST_DEVICE_COMMANDS"         : "Hier deine Befehle für Gerät {0} testen.",
        "TRY_OUT"                      : "ausprobieren",

        "TIMER_TRY"                    : "Timer {0} ausprobieren?",
        "TIMER_DELETE"                 : "Möchtest du den Timer {0} löschen?",

        "TOGGLE"                       : "Schalter",
        "TOGGLE_SELECT_DEVICE"         : "Schaltergerät auswählen.",
        "TOGGLE_SELECT_DESCR"          : "Beschreibung für den Schalter definieren.",
        "TOGGLE_SELECT_VALUE"          : "Wertfeld für den Schalter auswählen.",
        "TOGGLE_SELECT_ON"             : "EIN-Befehl für den Schalter auswählen.",
        "TOGGLE_SELECT_OFF"            : "AUS-Befehl für den Schalter auswählen.",
        "TOGGLE_DEVICE_DOESNT_EXIST"   : "FEHLER: Der Schalter in der Kopfzeile ist für das Device '{0}' definiert. Dieses Gerät ist nicht (mehr) vorhanden. Entferne den Schalter oder ändere das Schalter-Device.",

        "VERSION_AND_STATUS"           : "Versions- und Statusinformationen",

        "WORKING_MODES"                : "Arbeitsmodi",
        },
    "EN" : {
        "ADD_ELEMENTS"          : "Add elements",
        "ADD_DISPLAY"           : "Add display",
        "ADD_SCENE"             : "Add scene",
        "ADD_REMOTE"            : "Add remote",
        "ADD_DEVICE"            : "Add device",
        "ADD_LINE"              : "Add simple line",
        "ADD_EMPTY"             : "Add empty field",

        "AUDIO_IS_MAIN"         : "This device is defined as main AUDIO device.",
        "AUDIO_SET_AS_MAIN"     : "Set as main AUDIO device (change from &quot;{0}&quot;).",
        "AUDIO_N/A_AS_MAIN"     : "This device can't be set as main AUDIO device, no audio volume control available. (There is no key 'vol' or 'volume' defined in the device commands.)",
        
        "API"                   : "API",
        "API_ADMIN"             : "API admin",
        "API_CREATE_CONFIG"     : "create API config",
        "API_CREATE_DEV_CONFIG" : "create device config",
        "API_CREATE_CONFIG_INFO" : "Create a complete <b>API configuration</b> for all detected API devices to be saved as ./data/devices/{0}/00_interface.json. " +
                                   "The 'API-Devices' are created based on the default API definitions. Adapt the values such as 'PowerDevice' to your needs. " +
                                   "If a new device is not detected, reconnect the API, wait a few minutes, and try again.",
        "API_CREATE_DEV_CONFIG_INFO" : "Create a <b>device config file</b> for a device from its configuration and save this to the folder ./data/devices/{0}/&lt;device-name&gt;.json. " +
                                   "You can adapt key names for buttons and commands and the query section to your needs. " +
                                   "Select this file as device config when creating a new remote control for a device.",
        "API_DEVICE"            : "API device",
        "API_DEFINITION"        : "API definition",
        "API_INTERFACE"         : "API / API-Device",
        "API_CONNECTION"        : "API connection",
        "API_COMMANDS"          : "API commands",
        "API_COMMANDS_TEST"     : "API commands - manual testing",
        "API_DEVICE_DELETE"     : "Do you really want to delete the device <b>{1}</b> from the <b>API {0}</b>?",
        "API_DEVICE_DISCOVERY"  : "Do you want to start an API device discovery now? This will a few minutes and potentially slow down the server a bit.",
        "API_DEVICE_CONFIG_NA"  : "<b>ERROR:</b> There is no API configuration available, or it's corrupt. Check the data files or use a copy from the sample data set (<u>data/_sample/devices/*/00_interface.json</u>).",
        "API_RECONNECT_ALL"     : "Do you want to reconnect all devices now?",
        "API_INFORMATION"       : "API information",
        "API_SELECT_CMD"        : "API command or use your own ...",
        "API_INFO"              : "API info",
        "API_DEVICE_NOT_CONNECTED"   : "API device {0} not connected",
        "API_NOT_CONNECTED"          : "API {1} not connected",
        "API_SETTINGS"          : "API settings",
        "API_SETTINGS_OVERVIEW" : "API overview",
        "API_TEST"              : "API test",

        "API_EDIT_REALLY_CHANGE": "Do you really want to <b>change the API settings</b> for this remote control?",
        "API_EDIT_SELECT_API_CONFIG": "Please select an <b>API config</b> file",
        "API_EDIT_SELECT_API_DEVICE": "Please select a <b>device config</b> file",
        "API_EDIT_SELECT_REMOTE": "Please select a <b>remote control config</b> file",

        "BUTTON_ASK_DELETE"     : "Do you really want to delete the button '{0}_{1}' from '{2}'?",
        "BUTTON_ASK_DELETE_NUMBER" : "Do you really want to delete the button number [{0}] from '{1}'?",
        "BUTTON_INSERT_NAME"    : "Please insert name for button.",
        "BUTTON_RECORD"         : "Record button &quot;{0}&quot; for device &quot;{1}&quot;: click OK and then press the respective button on your remote control within the next 5 seconds.",
        "BUTTON_SELECT"         : "Please select button.",
        "BUTTON_INFOS"          : "Button Information",
        "BUTTON_IMAGE_DEFAULT"  : "default button image",
        
        "BUTTON_T"              : "button",
        "BUTTON_T_ADD"          : "add",
        "BUTTON_T_CLONE"        : "clone",
        "BUTTON_T_COLOR_PICKER" : "color picker",
        "BUTTON_T_COLOR"        : "color model",
        "BUTTON_T_CREATE"       : "create",
        "BUTTON_T_DEL"          : "delete button",
        "BUTTON_T_DELETE"       : "delete",
        "BUTTON_T_DEL_VALUE"    : "delete value",
        "BUTTON_T_DESCRIPTION"  : "description",
        "BUTTON_T_DEVICE"       : "device",
        "BUTTON_T_DISPLAY"      : "add display",
        "BUTTON_T_DISPLAY_VALUE": "display value",
        "BUTTON_T_EMPTY"        : "empty field",
        "BUTTON_T_HEADER"       : "header image",
        "BUTTON_T_KEYBOARD"     : "keyboard",
        "BUTTON_T_LINE"         : "line",
        "BUTTON_T_LINE_TEXT"    : "line with text",
        "BUTTON_T_MINMAX"       : "min-max",
        "BUTTON_T_MOVE2REMOTE"  : "move to remote",
        "BUTTON_T_PREVEW"       : "preview",
        "BUTTON_T_RESET"        : "reset",
        "BUTTON_T_SAVE"         : "save",
        "BUTTON_T_STOP_EDIT"    : "stop editing",
        "BUTTON_T_SEND"         : "send-command",
        "BUTTON_T_SHOW_HIDE"    : "show/hide",
        "BUTTON_T_SLIDER"       : "slider",
        "BUTTON_T_TEMPLATE"     : "template",
        "BUTTON_T_OTHER"        : "other button",
        "BUTTON_T_PARAMETER"    : "parameter",
        "BUTTON_T_PREVIEW"      : "preview",
        "BUTTON_T_VALUE"        : "add value",
        "BUTTON_T_TRY"          : "try",
        "BUTTON"                : "button",
        "BUTTONS"               : "buttons",

        "CHANNEL_USE_JSON"      : "Please use JSON to edit the channel list.",
        "CHANGE_ORDER"          : "Change order of remote controls",
        "CHANGE_ORDER_SCENES"   : "Change order of scenes",
        "CHANGE_ORDER_DEVICES"  : "Change order of devices",
        "CHANGE_MODES"          : "Change working modes",
        "CHANNEL"               : "channel",

        "CHART"                 : "chart",
        "CHART_EXISTS"          : "There is already a chart part of this remote control.",
        "CHART_NO_ENTRIES"      : "No entries available.",
        "CHART_ERROR_LOADING_CHART_JS": "Error: Could not load Chart.js.",
        "CHART_LOADING"         : "Loading chart data ...",
        "CHART_VALUE_EXISTS"    : "Value already exists.",
        "CHART_VALUE_DOESNT_EXISTS" : "Value doesn't exists.",
        "CHART_VALUE_SELECT"    : "Select chart value first.",

        "CONNECTION_ERROR"      : "Connection Error",
        "CONNECTION_POWER_OFF"  : "Power Off",
        "CONNECTION_DEVICE_OFF" : "Device Off",
        "CONNECTION_MANUAL"     : "Manual Mode",
        "CONNECTION_DISABLED"   : "API Disabled",
        "CONNECTED"             : "connected",
        "CONNECTED_DEVICES"     : "connected devices",
        "CONNECTED_RMC"         : "connected remote controls",
        "DETECTED_DEVICES"      : "detected devices",

        "COLOR_PICKER_SELECT_CMD": "Select command to insert color picker.",
        "COLOR_PICKER_SELECT_MODEL": "Select color model to insert color picker.",
        "COLOR_PICKER_N/A"      : "Color picker not supported",
        "COLOR_PICKER"          : "color picker",

        "CONFIG_INTERFACE"      : "Interface-Config",
        "CONFIG_API"            : "Config file <u>API</u>",
        "CONFIG_REMOTE"         : "Config file <u>remote control</u>",
        "CONFIG_DEVICE"         : "Config file <u>device</u>",
        "COMMANDS"              : "Commands",
        
        "COMMAND_DELETE_INFO"   : "When deleted you can record a command for a button again.",
        "COMMAND_RECORD_INFO"   : "Undefined buttons are colored blue. Click to record an IR command for those buttons.",
        "COPY"                  : "copy",
        "COPIED_TO_CLIPBOARD"   : "Copied content to clipboard.",
        "CREATE"                : "create",

        "DESCRIPTION"           : "Description",
        
        "DELETE"                : "delete",
        "DELETE_ELEMENTS"       : "Delete elements",
        "DELETE_COMMAND"        : "Delete command",

        "DEVICE"                    : "Device",
        "DEVICE_ASK_DELETE"         : "Do you really want to delete device '{0}'?",
        "DEVICE_DONT_EXISTS"        : "Device '{0}' doesn't exists!",
        "DEVICE_EXISTS"             : "Device '{0}' already exists!",
        "DEVICE_INSERT_ID"          : "Please insert ID for device (no special characters).",
        "DEVICE_INSERT_LABEL"       : "Please insert label for device.",
        "DEVICE_INSERT_NAME"        : "Please insert name of device.",
        "DEVICE_SELECT"             : "Please select device.",
        "DEVICE_SELECT_API"         : "Please select API for device.",
        "DEVICE_SELECT_TEMPLATE"    : "Please select template to create remote for device.",
        "DEVICE_SELECT_VISIBILITY"  : "Please select if device should be visible or hidden.",
        "DEVICES"                   : "devices",
        "DEVICES_NOT_CONNECTED"     : "Devices not connected",
        "DEVICES_NOT_DEFINED_YET"   : "No devices defined yet.",
        "DEVICES_ADD_SETTINGS"      : "Use settings to create remote controls.",

        "DISCOVERY_DONE"                : "OK: Discovery of API devices done.",
        "DISCOVERY_FAILED"              : "ERROR: Discovery of API devices failed.",

        "DISPLAY"                       : "display",
        "DISPLAY_EXISTS"                : "There is already a display part of this remote control.",
        "DISPLAY_LABEL_SELECT"          : "Select label to be deleted in the display.",
        "DISPLAY_LABEL_DONT_EXIST"      : "Selected label doesn't exist in display definition.",
        "DISPLAY_VALUE_SELECT"          : "Select device and value to be added in the display.",
        "DISPLAY_LABEL_ADD"             : "Insert label for the additional value in the display.",
        "DISPLAY_LABEL_EXISTS_ALREADY"  : "Label already exists in the display.",
        "DISPLAY_NOT_ADDED"             : "No display added yet. Changes below will have no effect.",
        
        "EDIT"                   : "edit",
        "EDIT_ADD_DISPLAY"       : "Add and edit display",
        "EDIT_DEVICE"            : "Edit device",
        "EDIT_DEVICES"           : "Edit devices",
        "EDIT_ARCHIVED_DEVICES"  : "Manage archived devices",
        "EDIT_DISPLAY"           : "Edit display",
        "EDIT_ELEMENTS"          : "Edit elements",
        "EDIT_JSON"              : "Edit JSON",
        "EDIT_INTERFACES"        : "Edit interfaces",
        "EDIT_INTERFACE"         : "Edit interface configuration for {0}",
        "EDIT_MACROS"            : "Edit macros",
        "EDIT_REMOTE"            : "Edit remote",
        "EDIT_REMOTES"           : "Edit remotes",
        "EDIT_SCENE"             : "Edit scene",
        "EDIT_SCENES"            : "Edit scenes",
        "EDIT_ARCHIVED_SCENES"   : "Manage archived scenes",
        "EDIT_RECORDINGS"        : "Edit recordings",
        "EDIT_RECORDING_SETTINGS": "Edit general settings",
        "EDIT_RECORDED_FIELDS"   : "Edit values to be recorded",

        "EXTERNAL_ID"            : "External ID",
        "EXECUTION_ERROR"        : "Could not execute command &quot;{2}&quot; for {0} <b>{1}</b>: <i>{3}</i>",
        "ERROR_UNKNOWN"          : "Unknown error",
        "ERROR_THREAD_TOO_LONG"  : "The thread <b>{0}</b> did not respond for <b>{1}s</b>.",
        "ERROR_LOST_LOCAL_NETWORK": "Lost connection to local network, and by that to all connected devices.",
        "ERROR_LOST_SERVER_CONNECT": "Lost connection to the server.",

        "FORMAT_INCORRECT"       : "format is not correct",
        "FAVICON_INFO"           : "Select a different favicon or apple-icon. <i>Note:</i> this selection at the moment is temporary only - " +
                                   "select and save WebApp to Home-Screen to use a specific apple-icon.",
        
        "GET_DATA"               : "Get data",
        "GET_AVAILABLE_COMMANDS" : "List commands",

        "HEADER"                : "header",
        "HEADER_IMAGE_EXISTS"   : "There is already a HEADER-IMAGE in this remote control.",
        
        "ID"                    : "ID",
        "IMAGE"                 : "Image",
        "INFO"                  : "info",
        "INTERFACES"            : "Interfaces",
        "INTERFACE_STATUS"      : "Interface Status",

        "JSON_EDIT"             : "Edit JSON data",
        "JSON_CHANNEL"          : "JSON channel macros",
        "JSON_DISPLAY"          : "JSON display information",
        "JSON_DEVICE"           : "JSON required devices",
        "JSON_REMOTE"           : "JSON remote control",
        "JSON_SCENE_MACROS"     : "JSON scene macros",
        "JSON_DEVICE_MACROS"    : "JSON device macros",
        "JSON_REMOTE_MACROS"    : "JSON macros (ON|OFF)",

        "JSON_REQUIRED_DEVICES"        : "Required devices",
        "JSON_EDIT_RMC_DEFINITION"     : "Edit remote control definition",
        "JSON_EDIT_DISPLAY_DEFINITION" : "Edit display definition",
        "JSON_EDIT_CHANNEL_MACROS"     : "Edit channel macros",
        "JSON_EDIT_MACRO_SCENE"        : "Edit macros SCENE",
        "JSON_EDIT_MACRO_SCENE_OTHER"  : "Edit scene macros",

        "LABEL"                 : "Label",

        "LOAD_TEMPLATE"         : "Load template",
        "LOADING_APP"           : "Loading App ...",

        "MACRO"                 : "macro",
        "MACROS"                : "macros",
        "MACRO_PLEASE_WAIT"     : "Executing commands, please wait a few seconds!",
        "MACRO_DEVICE_EDIT"     : "<p>Just for information; edit macros in the <u style='cursor:pointer;' onclick='rmSettings.create(\"edit_scenes\");'>scene settings</u> ...<br/></p>",
        "MACRO_EMPTY"           : "ERROR: This button of the &quot;{0}&quot; contains an empty macro.",

        "MACRO_EDIT_TIMING"     : "Wait [s]",
        "MACRO_EDIT_WAITING"    : "Wait message [s]",

        "MAIN"                  : "main",
        "MAIN_SETTINGS"         : "Main settings",
        "MANUAL"                : "manual",

        "MANUAL_ADD_ELEMENTS"   : "<h4>Add elements</h4><p>Here you can add different new elements to the remote control. All new elements will be added at the end of the remote control and can be moved up using the tool tip.</p>",
        "MANUAL_ADD_TEMPLATE"   : "<h4>Load template</h4><p>By loading a template you will overwrite the existing remote definition.</p>",
        "MANUAL_ADD_API-DEVICE" : "Select a detected <b>API device</b> from the list or chose &quot;OTHER&quot; to set an IPv4 address manually. " +
                                  "If the expected device is not in the list ensure the API device is switched on and try again in a few minutes.",

        "MANUAL_CHANNEL"        : "<i>Edit Channels:</i><br/><br/><ul class='help'>" +
                                  "<li>Fill dict for channel definition using the JSON format: " +
                                  "<i>&quot;Channel Name&quot; : [ &quot;button&quot;, &quot;button&quot;, &quot;macro&quot;]</i></li>" +
                                  "<li>Use &quot;&lt;device_id&gt;_&lt;button&gt;&quot; or &quot;&lt;macro_type&gt;_&lt;button&gt;&quot; to define buttons in channel macro; macro types are: macro, scene-on, scene-off, dev-on, dev-off</li>" +
                                  "</ul>",
        "MANUAL_DEVICES"        : "<i>Edit Devices for Scene</i><br/><br/><ul class='help'>" +
                                  "<li>Fill array of included devices using the JSON format: [&quot;device_id&quot;,&quot;device_id&quot;]</i>.</li>" +
                                  "</ul>",
        "MANUAL_DISPLAY"        : "<i>Edit Display Definition</i><br/><br/><ul class='help'>" +
                                  "<li>Fill dict for display definition using the JSON format: <i>&quot;Label&quot; : &quot;field_from_device&quot;</i>.</li>" +
                                  "<li>If &quot;auto_off&quot; is defined for the device (check JSON file), use &quot;auto-power-off&quot; as field to show the time till the devices automatically switches of.</li>" +
                                  "</ul>",
        "MANUAL_REMOTE"         : "<i>Edit Device Remote Control:</i><br/><br/><ul class='help'>" +
                                  "<li>Fill array of button names using the JSON format, four buttons per row.</li>" +
                                  "<li>Add &quot;LINE&quot; to add a horizontal line and &quot;LINE||description&quot; to add a line with text.</li>" +
                                  "<li>Add &quot;DISPLAY&quot; to add a display that show status information (details defined below).</li>" +
                                  "<li>Add &quot;SLIDER||send-&lt;command&gt;||&lt;description&gt;||&lt;min&gt;-&lt;max&gt;||&lt;parameter&gt;&quot; to add a slider input element.</li>" +
                                  "<li>Add &quot;COLOR-PICKER||send-&lt;command&gt;&quot; to add an input element to select a color.</li>" +
                                  "<li>Add &quot;.&quot; to add an empty space.</li>" +
                                  "</ul>",
        "MANUAL_SCENE"          : "<i>Edit Scene Remote Control:</i><br/><br/><ul class='help'>" +
                                  "<li>Fill array of button names using the JSON format, four buttons per row.</li>" +
                                  "<li>Use &quot;&lt;device_id&gt;_&lt;button&gt;&quot; or &quot;&lt;macro_type&gt;_&lt;button&gt;&quot; to define buttons in the remote layout; macro types are: macro, scene-on, scene-off, dev-on, dev-off</li>" +
                                  "<li>Add &quot;.&quot; to add an empty space.</li>" +
                                  "<li>Add &quot;LINE&quot; to add a horizontal line and &quot;LINE||description&quot; to add a line with text.</li>" +
                                  "<li>Add &quot;HEADER-IMAGE&quot; to add an image. The image can be selected in the scene settings.</li>" +
                                  "<li>Add &quot;TOGGLE||&lt;device&gt;_&lt;value&gt;||&lt;description&gt;||&lt;command_on&gt;||&lt;command_off&gt;&quot; to add a toggle."+
                                  " This is supported for values with ON|OFF or TRUE|FALSE only." +
                                  " If the toggle shall be integrated into the header image, place it directly below the &quot;HEADER-IMAGE&quot; and use &quot;HEADER-IMAGE||toggle&quot;.</li>" +
                                  "<li>Add &quot;SLIDER||send-&lt;value&gt;||&lt;description&gt;||&lt;range-from&gt;-&lt;range-to&gt;||&lt;value&gt;&quot; to add a slider."+
                                  " This is support for devices with query mode and if a number can be send via API." +
                                  "</ul>",
        "MANUAL_MACROS"            : "<h4>Edit Macros:</h4><ul class='help'>" +
                                  "<li>Here you can define macros using the JSON format. Macros can consist out of buttons from any defined remote control and integers for seconds to wait.</li>" +
                                  "<li><i>Important:</i> When you safe, there will be a generic check if the JSON format is correct. Please ensure, the required data structure is used as described below.</li>" +
                                  "<li><u>Groups (implementation in progress)</u>: combines several similar devices to a group to use the same buttons or commands for all devices at the same time."+
                                  "<br/><i>-&gt; Format:</i> \"&lt;group_id&gt;\" : {\"description\": \"&lt;description&gt;\", \"devices\": [\"&lt;device_01&gt;\",\"&lt;device_02&gt;\"]} </li>" +
                                  "<li>Groups can be used in all scenes (not in devices): 'group_&lt;button&gt;'.</li>" +
                                  "<li><u>Macro type DEV-ON</u>: macros to switch a device on/off, e.g., switch on and set initial volume (to be edited also in the respective device settings)."+
                                  "<br/><i>-&gt; Format:</i>  \"&lt;device&gt;\" : [\"&lt;device&gt;_&lt;button&gt;\", 2, \"&lt;device&gt;_&lt;button&gt;||&lt;value&gt;\",] </li>" +
                                  "<li><u>Macro type DEV-OFF</u>: macros to switch a device off (to be edited also in the respective device settings)." +
                                  "<br/><i>-&gt; Format:</i>  \"&lt;device&gt;\" : [\"&lt;device&gt;_&lt;button&gt;\", 2, \"&lt;device&gt;_&lt;button&gt;||&lt;value&gt;\",] </li>" +
                                  "<li><u>Global macros</u>: all other macros."+
                                  "<br/><i>-&gt; Format:</i> \"&lt;macro&gt;\" : [\"&lt;device&gt;_&lt;button&gt;||&lt;value&gt;\", 2, \"dev-on_&lt;device&gt;\"] </li>" +

                                  "<li>Macros can be used in all scenes (not in devices): 'macro_&lt;macro&gt;', 'dev-on_&lt;device&gt;', 'dev-off_&lt;device&gt;'. Note: if in the scene a macro with the same name is defined, the scene macro is used.</li>" +
                                  "<li>Start with &quot;MSG-xx&quot; in a macro to show a message that it's necessary to wait for xx seconds</li>" +
                                  "<li>For devices without API (method=record) use e.g. \"&lt;button&gt;||set-&lt;value&gt;\" to set a value without sending the command. This can be useful if you work with wifi controlled outlets and a device always start in mode \"ON\".</li>" +
                                  "</ul>",
        "MANUAL_MACROS_SCENE"   : "<i>Edit Macros for this scene:</i><br/><br/><ul class='help'>" +
                                  "<li>Define macros using the JSON format. Combine buttons from any defined device, global macros, and integers for seconds to wait.</li>" +
                                  "<li><u>Macro type SCENE ON</u>: add here all buttons / commands to switch all devices of this scene on, set input channels and similar. Use the macro as \"scene-on\" in the remote definition."+
                                  "<br/><i>-&gt; Format:</i> [\"&lt;device&gt;_&lt;button&gt;\", 2, \"dev-on_&lt;device&gt;\"] </li>" +
                                  "<li><u>Macro type SCENE OFF</u>: add here all buttons / commands to switch all devices of a scene off. Use the macro as \"scene-off\" in the remote definition."+
                                  "<br/><i>-&gt; Format:</i> [\"&lt;device&gt;_&lt;button&gt;\", 2, \"dev-on_&lt;device&gt;\"] </li>" +
                                  "<li><u>Other scene macros</u>: add here all buttons / commands to create another macro for this scene."+
                                  "<br/><i>-&gt; Format:</i> {\"&lt;macro_name&gt;\" : [\"&lt;device&gt;_&lt;button&gt;\", 2, \"dev-on_&lt;device&gt;\"]}</li>" +
                                  "<li>Use the command &quot;MSG-xx&quot; in a macro to show a message that it's necessary to wait for xx seconds</li>" +
                                  "<li>For devices without API (method=record) use e.g. \"&lt;button&gt;||set-&lt;value&gt;\" to set a value without sending the command. This can be useful if you work with wifi controlled sockets and a device always start in mode \"ON\".</li>" +
                                  "</ul>",

        "METHOD"                : "Method",
        "MENU_SHOW_HIDDEN_ON"   : "Show invisible",
        "MENU_SHOW_HIDDEN_OFF"  : "Hide invisible",

        "MISSING_DATA"          : "Data are missing for '{0}'.<br/>Check files '{1}' and '{2}' in data directory.",
        "MISSING_DATA_SCENE"    : "Data are missing for '{0}'.<br/>Check file '{1}' in data directory.",
        
        "MODE_SHOW_BUTTON"      : "Show button code",
        "MODE_EDIT"             : "Edit mode",
        "MODE_INTELLIGENT"      : "Intelligent mode",
        "MODE_MANUAL"           : "Manual mode",
        "MODE_EASY_EDIT"        : "Easy edit",
        "MODE_JSON_HIGHLIGHT"   : "JSON highlighting",
        "MODE_HINT"             : "Show hints for remote controls (not only errors)",

        "MSG_ONLY_ONE_COLOR_PICKER"    : "This color picker already exists in the remote control, only one is possible.",
        
        "NOT_USED"                     : "not used in remote control",
        "NO_DEVICE_CONNECTED"          : "no device connected",
        "NO_REMOTE_CONNECTED"          : "no remote control connected",
        "NO_HEADER_DEFINED"            : "No header image selected yet, edit in the scene settings.",

        "OFFLINE"                      : "Offline",

        "PLEASE_WAIT"                  : "Please wait ... .",
        
        "PREVIEW"                      : "Preview",
        "POWER_DEVICE_OFF"             : "Switch on the power device first. {0}",
        "POWER_DEVICE_OFF_SCENE"       : "Switch on the power device using the toggle in the header. {0}",
        "POWER_DEVICE_OFF_SCENE_INFO"  : "<b>Power Off:</b> Use the toggle in the header to switch on.",

        "QUICK_ACCESS"                 : "Quick Access",

        "RECONNECT"                    : "reconnect",
        "RECONNECT_DONE"               : "OK: Reconnect done ({0}).",
        "RECONNECT_FAILED"             : "ERROR: Reconnect failed ({0}).",

        "RECORD_COMMAND"               : "record command",
        "RECORD_DELETE_COMMANDS"       : "Record or delete commands",
        "REMOTE"                       : "remote",
        "REMOTE_ADD"                   : "Add remote controls",
        "REMOTE_CONFIG_ERROR"          : "Error in remote config file(s) '{0}': ",
        "REMOTE_CONFIG_ERROR_UNKNOWN"  : "Unknown error in remote config file(s) '{0}'",
        "RELOAD_TAKES_LONGER"          : "Reload takes longer than expected ...",
        "RELOAD_TAKES_MUCH_LONGER"     : "Reload takes longer than much expected ...",
        "RESET_SWITCH_OFF"             : "Reset devices without API connect:<br/>switch off all devices before.",
        "RESET_VOLUME_TO_ZERO"         : "Reset audio settings for devices without API connect:<br/>set the volume of all audio devices to mininum (0) before.",
        "RESTART"                      : "Are you sure you want to restart the server?",
        "RELOAD_ALL_SCRIPTS"           : "Reload all CSS and JavaScript files.",
        "REMOTE_MOVE_TO_ARCHIVE"       : "Do you want to move the {0} remote control <b>{1}</b> to archive?",
        "REMOTE_RESTORE_FROM_ARCHIVE"  : "Do you want to restore the {0} remote control <b>{1}</b> from archive?",

        "SAVE"                         : "Save",

        "SCENE"                        : "scene",
        "SCENE_STATUS"                 : "Scene status",
        "SCENE_CONFIG_ERROR"           : "Error in scene config file(s) '{0}': ",
        "SCENE_CONFIG_ERROR_UNKNOWN"   : "Unknown error in scene config file(s) '{0}'",

        "SCENE_ASK_DELETE"             : "Do you really want to delete scene '{0}'?",
        "SCENE_EXISTS"                 : "Scene '{0}' already exists!",
        "SCENE_IMAGE"                  : "Scene image",
        "SCENE_INSERT_ID"              : "Please insert ID for scene (no special characters).",
        "SCENE_INSERT_LABEL"           : "Please insert label for scene.",
        "SCENE_SELECT"                 : "Please select scene.",
        "SCENES_NOT_DEFINED_YET"       : "No scenes defined yet.",

        "SEND_DATA"                    : "Send data",
        "SELECT"                       : "Select",
        "SELECT_DEV_MACRO"             : "select device or macro",
        "SELECT_DEV_FIRST"             : "select device first",
        "SELECT_DEV_TYPE_FIRST"        : "select device type first",
        "SELECT_API_FIRST"             : "select interface first",
        "SERVER_SETTINGS"              : "Server &amp; client settings",
        "SETTINGS"                     : "Settings",
        "SETTINGS_GENERAL"             : "General settings",
        "SETTINGS_REMOTE"              : "Remote Control Settings",
        "SETTINGS_DEVICES"             : "Device Settings",
        "SETTINGS_API"                 : "API Settings",
        "SETTINGS_MACROS"              : "Global Macros &amp; Groups",
        "SETTINGS_SCENES"              : "Scene Settings",
        "SETTINGS_TIMER"               : "Timer Settings",
        "SETTINGS_RECORDINGS"          : "Recording Settings",

        "SLIDER"                       : "slider",
        "SLIDER_SELECT_CMD"            : "Select command, to insert slider.",
        "SLIDER_SELECT_PARAM"          : "Select parameter, to insert slider.",
        "SLIDER_INSERT_DESCR"          : "Insert description, to insert slider.",
        "SLIDER_INSERT_MINMAX"         : "Insert minimum and maximum value (min-max), to insert slider.",
        "SLIDER_N/A"                   : "Slider not supported",

        "STATUS_DEV_OK"                : "Device <b>{0}</b> is OK.",
        "STATUS_DEV_N/A"               : "The power status of the device <b>{0}</b> is not available. Just try out.",
        "STATUS_DEV_POWER_OFF"         : "The power device is switched off: <b>{0}</b>.",
        "STATUS_DEV_ERROR"             : "An error occurred for device <b>{0}</b>. {1}",
        "STATUS_DEV_API_DISABLED"      : "The API <b>{0}</b> for the device <b>{1}</b> has been disabled.",
        "STATUS_DEV_API_STARTING"      : "The API <b>{0}</b> for the device <b>{1}</b> is starting, please wait.",
        "STATUS_DEV_API_ERROR"         : "An API error occurred for <b>{0}</b> and the connected device <b>{1}</b>: <i>{2}</i>",
        "STATUS_DEV_OTHER_ERROR"       : "Unknown error occurred for the device <b>{0}</b>.",
        "STATUS_DEV_EMPTY"             : "For this device <b>{0}</b> no remote control layout is defined yet.",

        "STATUS_GROUP_OK"                : "Group <b>{0}</b> and its devices are OK.",
        "STATUS_GROUP_N/A"               : "The power status of the group <b>{0}</b> is not available. Just try out.",
        "STATUS_GROUP_POWER_OFF"         : "At least one for the group <b>{0}</b> relevant power device is switched off: {1}.",
        "STATUS_GROUP_ERROR"             : "An error occurred for at least on device of the group <b>{0}</b>. {1}",
        "STATUS_GROUP_API_DISABLED"      : "The API <b>{0}</b> for the device <b>{1}</b> has been disabled.",
        "STATUS_GROUP_API_STARTING"      : "At least one API of the group <b>{0}</b> is starting, please wait.",
        "STATUS_GROUP_API_ERROR"         : "At least for one API for the group <b>{1}</b> an error occurred: <i>{2}</i>",
        "STATUS_GROUP_OTHER_ERROR"       : "Unknown error occurred for the group <b>{0}</b>.",
        "STATUS_GROUP_EMPTY"             : "For the group <b>{0}</b> no devices are defined yet.",

        "STATUS_SCENE_OK"              : "Scene <b>{0}</b> is OK.",
        "STATUS_SCENE_OFF"               : "All devices of the scene <b>{0}</b> are switched off.",
        "STATUS_SCENE_STARTING"        : "At least one required API the scene <b>{0}</b> is (re)starting, please wait.",
        "STATUS_SCENE_POWER_OFF"       : "Power device <b>{1}</b> for scene <b>{0}</b> is switched off.",
        "STATUS_SCENE_PARTLY"          : "For the scene <b>{0}</b> required devices are still switched off: <i>{1}</i>. Press 'ON' to switch on the missing devices.",
        "STATUS_SCENE_DISABLED"        : "At least one for the scene <b>{0}</b> required API is disabled:  <i>{1}</i>",
        "STATUS_SCENE_ERROR"           : "For at least one of the required devices for the scene <b>{0}</b> an error occurred: <i>{1}</i>.",
        "STATUS_SCENE_EMPTY"           : "For this scene <b>{0}</b> no remote control layout is defined yet.",

        "STATUS_SCENE_API_DISABLED"    : "At least one for the scene <b>{0}</b> required API  is disabled: <i>{1}</i>",
        "STATUS_SCENE_NO_DEVICES"      : "There a no required devices defined for this scene <b>{0}</b>.",

        "STATUS_NO_SERVER_CONNECT"      : "At the moment there is no connection to the server.",

        "TEXT_INPUT"                   : "Text input",
        "TEMPLATE"                     : "template",
        "TEMPLATE_OVERWRITE"           : "Do you really want overwrite buttons of '{0}' with template '{1}'?",
        "TEST_DEVICE_COMMANDS"         : "Test here your commands for device {0}.",
        "TRY_OUT"                      : "try out",

        "TIMER_TRY"                    : "Try out timer {0}?",
        "TIMER_DELETE"                 : "Do you want to delete the timer {0}?",

        "TOGGLE"                       : "toggle",
        "TOGGLE_SELECT_DEVICE"         : "Select a toggle device.",
        "TOGGLE_SELECT_DESCR"          : "Define a description for the toggle.",
        "TOGGLE_SELECT_VALUE"          : "Select a value field for the toggle.",
        "TOGGLE_SELECT_ON"             : "Select a switch ON command for the toggle.",
        "TOGGLE_SELECT_OFF"            : "Select a switch OFF command for the toggle.",
        "TOGGLE_DEVICE_DOESNT_EXIST"   : "ERROR: The power toggle in the header is defined for the device '{0}'. This device is not defined (anymore). Remove the toggle or change the power device for the toggle.",

        "VERSION_AND_STATUS"           : "Version and Status Information",

        "WORKING_MODES"                : "Working modes",
        }
    }

remote_scripts_loaded += 1;
