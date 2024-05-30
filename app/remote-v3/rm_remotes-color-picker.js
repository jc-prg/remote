// uses parts from source: https://www.w3docs.com/tools/color-picker

function rmColorPicker(name) {

	this.hh = 0;
	this.class_name = name;

	this.set_device     = function(name) {

		this.active_name = name;		
		}


    // color picker visualization v1
	this.colorPickerHTML = function (send_command) {
		html = `
    <div style="margin:auto;width:236px;">
      <img style="margin-right:2px;" src="remote-v3/img/img_colormap.gif" usemap="#colormap" alt="colormap"><map id="colormap" name="colormap" onmouseout="mouseOutMap()">
      <area style="cursor:pointer" shape="poly" coords="63,0,72,4,72,15,63,19,54,15,54,4" onclick='clickColor("${send_command}","#003366",-200,54)' onmouseover='mouseOverColor("#003366")' alt="#003366">
      <area style="cursor:pointer" shape="poly" coords="81,0,90,4,90,15,81,19,72,15,72,4" onclick='clickColor("${send_command}","#336699",-200,72)' onmouseover='mouseOverColor("#336699")' alt="#336699">
      <area style="cursor:pointer" shape="poly" coords="99,0,108,4,108,15,99,19,90,15,90,4" onclick='clickColor("${send_command}","#3366CC",-200,90)' onmouseover='mouseOverColor("#3366CC")' alt="#3366CC">
      <area style="cursor:pointer" shape="poly" coords="117,0,126,4,126,15,117,19,108,15,108,4" onclick='clickColor("${send_command}","#003399",-200,108)' onmouseover='mouseOverColor("#003399")' alt="#003399">
      <area style="cursor:pointer" shape="poly" coords="135,0,144,4,144,15,135,19,126,15,126,4" onclick='clickColor("${send_command}","#000099",-200,126)' onmouseover='mouseOverColor("#000099")' alt="#000099">
      <area style="cursor:pointer" shape="poly" coords="153,0,162,4,162,15,153,19,144,15,144,4" onclick='clickColor("${send_command}","#0000CC",-200,144)' onmouseover='mouseOverColor("#0000CC")' alt="#0000CC">
      <area style="cursor:pointer" shape="poly" coords="171,0,180,4,180,15,171,19,162,15,162,4" onclick='clickColor("${send_command}","#000066",-200,162)' onmouseover='mouseOverColor("#000066")' alt="#000066">
      <area style="cursor:pointer" shape="poly" coords="54,15,63,19,63,30,54,34,45,30,45,19" onclick='clickColor("${send_command}","#006666",-185,45)' onmouseover='mouseOverColor("#006666")' alt="#006666">
      <area style="cursor:pointer" shape="poly" coords="72,15,81,19,81,30,72,34,63,30,63,19" onclick='clickColor("${send_command}","#006699",-185,63)' onmouseover='mouseOverColor("#006699")' alt="#006699">
      <area style="cursor:pointer" shape="poly" coords="90,15,99,19,99,30,90,34,81,30,81,19" onclick='clickColor("${send_command}","#0099CC",-185,81)' onmouseover='mouseOverColor("#0099CC")' alt="#0099CC">
      <area style="cursor:pointer" shape="poly" coords="108,15,117,19,117,30,108,34,99,30,99,19" onclick='clickColor("${send_command}","#0066CC",-185,99)' onmouseover='mouseOverColor("#0066CC")' alt="#0066CC">
      <area style="cursor:pointer" shape="poly" coords="126,15,135,19,135,30,126,34,117,30,117,19" onclick='clickColor("${send_command}","#0033CC",-185,117)' onmouseover='mouseOverColor("#0033CC")' alt="#0033CC">
      <area style="cursor:pointer" shape="poly" coords="144,15,153,19,153,30,144,34,135,30,135,19" onclick='clickColor("${send_command}","#0000FF",-185,135)' onmouseover='mouseOverColor("#0000FF")' alt="#0000FF">
      <area style="cursor:pointer" shape="poly" coords="162,15,171,19,171,30,162,34,153,30,153,19" onclick='clickColor("${send_command}","#3333FF",-185,153)' onmouseover='mouseOverColor("#3333FF")' alt="#3333FF">
      <area style="cursor:pointer" shape="poly" coords="180,15,189,19,189,30,180,34,171,30,171,19" onclick='clickColor("${send_command}","#333399",-185,171)' onmouseover='mouseOverColor("#333399")' alt="#333399">
      <area style="cursor:pointer" shape="poly" coords="45,30,54,34,54,45,45,49,36,45,36,34" onclick='clickColor("${send_command}","#669999",-170,36)' onmouseover='mouseOverColor("#669999")' alt="#669999">
      <area style="cursor:pointer" shape="poly" coords="63,30,72,34,72,45,63,49,54,45,54,34" onclick='clickColor("${send_command}","#009999",-170,54)' onmouseover='mouseOverColor("#009999")' alt="#009999">
      <area style="cursor:pointer" shape="poly" coords="81,30,90,34,90,45,81,49,72,45,72,34" onclick='clickColor("${send_command}","#33CCCC",-170,72)' onmouseover='mouseOverColor("#33CCCC")' alt="#33CCCC">
      <area style="cursor:pointer" shape="poly" coords="99,30,108,34,108,45,99,49,90,45,90,34" onclick='clickColor("${send_command}","#00CCFF",-170,90)' onmouseover='mouseOverColor("#00CCFF")' alt="#00CCFF">
      <area style="cursor:pointer" shape="poly" coords="117,30,126,34,126,45,117,49,108,45,108,34" onclick='clickColor("${send_command}","#0099FF",-170,108)' onmouseover='mouseOverColor("#0099FF")' alt="#0099FF">
      <area style="cursor:pointer" shape="poly" coords="135,30,144,34,144,45,135,49,126,45,126,34" onclick='clickColor("${send_command}","#0066FF",-170,126)' onmouseover='mouseOverColor("#0066FF")' alt="#0066FF">
      <area style="cursor:pointer" shape="poly" coords="153,30,162,34,162,45,153,49,144,45,144,34" onclick='clickColor("${send_command}","#3366FF",-170,144)' onmouseover='mouseOverColor("#3366FF")' alt="#3366FF">
      <area style="cursor:pointer" shape="poly" coords="171,30,180,34,180,45,171,49,162,45,162,34" onclick='clickColor("${send_command}","#3333CC",-170,162)' onmouseover='mouseOverColor("#3333CC")' alt="#3333CC">
      <area style="cursor:pointer" shape="poly" coords="189,30,198,34,198,45,189,49,180,45,180,34" onclick='clickColor("${send_command}","#666699",-170,180)' onmouseover='mouseOverColor("#666699")' alt="#666699">
      <area style="cursor:pointer" shape="poly" coords="36,45,45,49,45,60,36,64,27,60,27,49" onclick='clickColor("${send_command}","#339966",-155,27)' onmouseover='mouseOverColor("#339966")' alt="#339966">
      <area style="cursor:pointer" shape="poly" coords="54,45,63,49,63,60,54,64,45,60,45,49" onclick='clickColor("${send_command}","#00CC99",-155,45)' onmouseover='mouseOverColor("#00CC99")' alt="#00CC99">
      <area style="cursor:pointer" shape="poly" coords="72,45,81,49,81,60,72,64,63,60,63,49" onclick='clickColor("${send_command}","#00FFCC",-155,63)' onmouseover='mouseOverColor("#00FFCC")' alt="#00FFCC">
      <area style="cursor:pointer" shape="poly" coords="90,45,99,49,99,60,90,64,81,60,81,49" onclick='clickColor("${send_command}","#00FFFF",-155,81)' onmouseover='mouseOverColor("#00FFFF")' alt="#00FFFF">
      <area style="cursor:pointer" shape="poly" coords="108,45,117,49,117,60,108,64,99,60,99,49" onclick='clickColor("${send_command}","#33CCFF",-155,99)' onmouseover='mouseOverColor("#33CCFF")' alt="#33CCFF">
      <area style="cursor:pointer" shape="poly" coords="126,45,135,49,135,60,126,64,117,60,117,49" onclick='clickColor("${send_command}","#3399FF",-155,117)' onmouseover='mouseOverColor("#3399FF")' alt="#3399FF">
      <area style="cursor:pointer" shape="poly" coords="144,45,153,49,153,60,144,64,135,60,135,49" onclick='clickColor("${send_command}","#6699FF",-155,135)' onmouseover='mouseOverColor("#6699FF")' alt="#6699FF">
      <area style="cursor:pointer" shape="poly" coords="162,45,171,49,171,60,162,64,153,60,153,49" onclick='clickColor("${send_command}","#6666FF",-155,153)' onmouseover='mouseOverColor("#6666FF")' alt="#6666FF">
      <area style="cursor:pointer" shape="poly" coords="180,45,189,49,189,60,180,64,171,60,171,49" onclick='clickColor("${send_command}","#6600FF",-155,171)' onmouseover='mouseOverColor("#6600FF")' alt="#6600FF">
      <area style="cursor:pointer" shape="poly" coords="198,45,207,49,207,60,198,64,189,60,189,49" onclick='clickColor("${send_command}","#6600CC",-155,189)' onmouseover='mouseOverColor("#6600CC")' alt="#6600CC">
      <area style="cursor:pointer" shape="poly" coords="27,60,36,64,36,75,27,79,18,75,18,64" onclick='clickColor("${send_command}","#339933",-140,18)' onmouseover='mouseOverColor("#339933")' alt="#339933">
      <area style="cursor:pointer" shape="poly" coords="45,60,54,64,54,75,45,79,36,75,36,64" onclick='clickColor("${send_command}","#00CC66",-140,36)' onmouseover='mouseOverColor("#00CC66")' alt="#00CC66">
      <area style="cursor:pointer" shape="poly" coords="63,60,72,64,72,75,63,79,54,75,54,64" onclick='clickColor("${send_command}","#00FF99",-140,54)' onmouseover='mouseOverColor("#00FF99")' alt="#00FF99">
      <area style="cursor:pointer" shape="poly" coords="81,60,90,64,90,75,81,79,72,75,72,64" onclick='clickColor("${send_command}","#66FFCC",-140,72)' onmouseover='mouseOverColor("#66FFCC")' alt="#66FFCC">
      <area style="cursor:pointer" shape="poly" coords="99,60,108,64,108,75,99,79,90,75,90,64" onclick='clickColor("${send_command}","#66FFFF",-140,90)' onmouseover='mouseOverColor("#66FFFF")' alt="#66FFFF">
      <area style="cursor:pointer" shape="poly" coords="117,60,126,64,126,75,117,79,108,75,108,64" onclick='clickColor("${send_command}","#66CCFF",-140,108)' onmouseover='mouseOverColor("#66CCFF")' alt="#66CCFF">
      <area style="cursor:pointer" shape="poly" coords="135,60,144,64,144,75,135,79,126,75,126,64" onclick='clickColor("${send_command}","#99CCFF",-140,126)' onmouseover='mouseOverColor("#99CCFF")' alt="#99CCFF">
      <area style="cursor:pointer" shape="poly" coords="153,60,162,64,162,75,153,79,144,75,144,64" onclick='clickColor("${send_command}","#9999FF",-140,144)' onmouseover='mouseOverColor("#9999FF")' alt="#9999FF">
      <area style="cursor:pointer" shape="poly" coords="171,60,180,64,180,75,171,79,162,75,162,64" onclick='clickColor("${send_command}","#9966FF",-140,162)' onmouseover='mouseOverColor("#9966FF")' alt="#9966FF">
      <area style="cursor:pointer" shape="poly" coords="189,60,198,64,198,75,189,79,180,75,180,64" onclick='clickColor("${send_command}","#9933FF",-140,180)' onmouseover='mouseOverColor("#9933FF")' alt="#9933FF">
      <area style="cursor:pointer" shape="poly" coords="207,60,216,64,216,75,207,79,198,75,198,64" onclick='clickColor("${send_command}","#9900FF",-140,198)' onmouseover='mouseOverColor("#9900FF")' alt="#9900FF">
      <area style="cursor:pointer" shape="poly" coords="18,75,27,79,27,90,18,94,9,90,9,79" onclick='clickColor("${send_command}","#006600",-125,9)' onmouseover='mouseOverColor("#006600")' alt="#006600">
      <area style="cursor:pointer" shape="poly" coords="36,75,45,79,45,90,36,94,27,90,27,79" onclick='clickColor("${send_command}","#00CC00",-125,27)' onmouseover='mouseOverColor("#00CC00")' alt="#00CC00">
      <area style="cursor:pointer" shape="poly" coords="54,75,63,79,63,90,54,94,45,90,45,79" onclick='clickColor("${send_command}","#00FF00",-125,45)' onmouseover='mouseOverColor("#00FF00")' alt="#00FF00">
      <area style="cursor:pointer" shape="poly" coords="72,75,81,79,81,90,72,94,63,90,63,79" onclick='clickColor("${send_command}","#66FF99",-125,63)' onmouseover='mouseOverColor("#66FF99")' alt="#66FF99">
      <area style="cursor:pointer" shape="poly" coords="90,75,99,79,99,90,90,94,81,90,81,79" onclick='clickColor("${send_command}","#99FFCC",-125,81)' onmouseover='mouseOverColor("#99FFCC")' alt="#99FFCC">
      <area style="cursor:pointer" shape="poly" coords="108,75,117,79,117,90,108,94,99,90,99,79" onclick='clickColor("${send_command}","#CCFFFF",-125,99)' onmouseover='mouseOverColor("#CCFFFF")' alt="#CCFFFF">
      <area style="cursor:pointer" shape="poly" coords="126,75,135,79,135,90,126,94,117,90,117,79" onclick='clickColor("${send_command}","#CCCCFF",-125,117)' onmouseover='mouseOverColor("#CCCCFF")' alt="#CCCCFF">
      <area style="cursor:pointer" shape="poly" coords="144,75,153,79,153,90,144,94,135,90,135,79" onclick='clickColor("${send_command}","#CC99FF",-125,135)' onmouseover='mouseOverColor("#CC99FF")' alt="#CC99FF">
      <area style="cursor:pointer" shape="poly" coords="162,75,171,79,171,90,162,94,153,90,153,79" onclick='clickColor("${send_command}","#CC66FF",-125,153)' onmouseover='mouseOverColor("#CC66FF")' alt="#CC66FF">
      <area style="cursor:pointer" shape="poly" coords="180,75,189,79,189,90,180,94,171,90,171,79" onclick='clickColor("${send_command}","#CC33FF",-125,171)' onmouseover='mouseOverColor("#CC33FF")' alt="#CC33FF">
      <area style="cursor:pointer" shape="poly" coords="198,75,207,79,207,90,198,94,189,90,189,79" onclick='clickColor("${send_command}","#CC00FF",-125,189)' onmouseover='mouseOverColor("#CC00FF")' alt="#CC00FF">
      <area style="cursor:pointer" shape="poly" coords="216,75,225,79,225,90,216,94,207,90,207,79" onclick='clickColor("${send_command}","#9900CC",-125,207)' onmouseover='mouseOverColor("#9900CC")' alt="#9900CC">
      <area style="cursor:pointer" shape="poly" coords="9,90,18,94,18,105,9,109,0,105,0,94" onclick='clickColor("${send_command}","#003300",-110,0)' onmouseover='mouseOverColor("#003300")' alt="#003300">
      <area style="cursor:pointer" shape="poly" coords="27,90,36,94,36,105,27,109,18,105,18,94" onclick='clickColor("${send_command}","#009933",-110,18)' onmouseover='mouseOverColor("#009933")' alt="#009933">
      <area style="cursor:pointer" shape="poly" coords="45,90,54,94,54,105,45,109,36,105,36,94" onclick='clickColor("${send_command}","#33CC33",-110,36)' onmouseover='mouseOverColor("#33CC33")' alt="#33CC33">
      <area style="cursor:pointer" shape="poly" coords="63,90,72,94,72,105,63,109,54,105,54,94" onclick='clickColor("${send_command}","#66FF66",-110,54)' onmouseover='mouseOverColor("#66FF66")' alt="#66FF66">
      <area style="cursor:pointer" shape="poly" coords="81,90,90,94,90,105,81,109,72,105,72,94" onclick='clickColor("${send_command}","#99FF99",-110,72)' onmouseover='mouseOverColor("#99FF99")' alt="#99FF99">
      <area style="cursor:pointer" shape="poly" coords="99,90,108,94,108,105,99,109,90,105,90,94" onclick='clickColor("${send_command}","#CCFFCC",-110,90)' onmouseover='mouseOverColor("#CCFFCC")' alt="#CCFFCC">
      <area style="cursor:pointer" shape="poly" coords="117,90,126,94,126,105,117,109,108,105,108,94" onclick='clickColor("${send_command}","#FFFFFF",-110,108)' onmouseover='mouseOverColor("#FFFFFF")' alt="#FFFFFF">
      <area style="cursor:pointer" shape="poly" coords="135,90,144,94,144,105,135,109,126,105,126,94" onclick='clickColor("${send_command}","#FFCCFF",-110,126)' onmouseover='mouseOverColor("#FFCCFF")' alt="#FFCCFF">
      <area style="cursor:pointer" shape="poly" coords="153,90,162,94,162,105,153,109,144,105,144,94" onclick='clickColor("${send_command}","#FF99FF",-110,144)' onmouseover='mouseOverColor("#FF99FF")' alt="#FF99FF">
      <area style="cursor:pointer" shape="poly" coords="171,90,180,94,180,105,171,109,162,105,162,94" onclick='clickColor("${send_command}","#FF66FF",-110,162)' onmouseover='mouseOverColor("#FF66FF")' alt="#FF66FF">
      <area style="cursor:pointer" shape="poly" coords="189,90,198,94,198,105,189,109,180,105,180,94" onclick='clickColor("${send_command}","#FF00FF",-110,180)' onmouseover='mouseOverColor("#FF00FF")' alt="#FF00FF">
      <area style="cursor:pointer" shape="poly" coords="207,90,216,94,216,105,207,109,198,105,198,94" onclick='clickColor("${send_command}","#CC00CC",-110,198)' onmouseover='mouseOverColor("#CC00CC")' alt="#CC00CC">
      <area style="cursor:pointer" shape="poly" coords="225,90,234,94,234,105,225,109,216,105,216,94" onclick='clickColor("${send_command}","#660066",-110,216)' onmouseover='mouseOverColor("#660066")' alt="#660066">
      <area style="cursor:pointer" shape="poly" coords="18,105,27,109,27,120,18,124,9,120,9,109" onclick='clickColor("${send_command}","#336600",-95,9)' onmouseover='mouseOverColor("#336600")' alt="#336600">
      <area style="cursor:pointer" shape="poly" coords="36,105,45,109,45,120,36,124,27,120,27,109" onclick='clickColor("${send_command}","#009900",-95,27)' onmouseover='mouseOverColor("#009900")' alt="#009900">
      <area style="cursor:pointer" shape="poly" coords="54,105,63,109,63,120,54,124,45,120,45,109" onclick='clickColor("${send_command}","#66FF33",-95,45)' onmouseover='mouseOverColor("#66FF33")' alt="#66FF33">
      <area style="cursor:pointer" shape="poly" coords="72,105,81,109,81,120,72,124,63,120,63,109" onclick='clickColor("${send_command}","#99FF66",-95,63)' onmouseover='mouseOverColor("#99FF66")' alt="#99FF66">
      <area style="cursor:pointer" shape="poly" coords="90,105,99,109,99,120,90,124,81,120,81,109" onclick='clickColor("${send_command}","#CCFF99",-95,81)' onmouseover='mouseOverColor("#CCFF99")' alt="#CCFF99">
      <area style="cursor:pointer" shape="poly" coords="108,105,117,109,117,120,108,124,99,120,99,109" onclick='clickColor("${send_command}","#FFFFCC",-95,99)' onmouseover='mouseOverColor("#FFFFCC")' alt="#FFFFCC">
      <area style="cursor:pointer" shape="poly" coords="126,105,135,109,135,120,126,124,117,120,117,109" onclick='clickColor("${send_command}","#FFCCCC",-95,117)' onmouseover='mouseOverColor("#FFCCCC")' alt="#FFCCCC">
      <area style="cursor:pointer" shape="poly" coords="144,105,153,109,153,120,144,124,135,120,135,109" onclick='clickColor("${send_command}","#FF99CC",-95,135)' onmouseover='mouseOverColor("#FF99CC")' alt="#FF99CC">
      <area style="cursor:pointer" shape="poly" coords="162,105,171,109,171,120,162,124,153,120,153,109" onclick='clickColor("${send_command}","#FF66CC",-95,153)' onmouseover='mouseOverColor("#FF66CC")' alt="#FF66CC">
      <area style="cursor:pointer" shape="poly" coords="180,105,189,109,189,120,180,124,171,120,171,109" onclick='clickColor("${send_command}","#FF33CC",-95,171)' onmouseover='mouseOverColor("#FF33CC")' alt="#FF33CC">
      <area style="cursor:pointer" shape="poly" coords="198,105,207,109,207,120,198,124,189,120,189,109" onclick='clickColor("${send_command}","#CC0099",-95,189)' onmouseover='mouseOverColor("#CC0099")' alt="#CC0099">
      <area style="cursor:pointer" shape="poly" coords="216,105,225,109,225,120,216,124,207,120,207,109" onclick='clickColor("${send_command}","#993399",-95,207)' onmouseover='mouseOverColor("#993399")' alt="#993399">
      <area style="cursor:pointer" shape="poly" coords="27,120,36,124,36,135,27,139,18,135,18,124" onclick='clickColor("${send_command}","#333300",-80,18)' onmouseover='mouseOverColor("#333300")' alt="#333300">
      <area style="cursor:pointer" shape="poly" coords="45,120,54,124,54,135,45,139,36,135,36,124" onclick='clickColor("${send_command}","#669900",-80,36)' onmouseover='mouseOverColor("#669900")' alt="#669900">
      <area style="cursor:pointer" shape="poly" coords="63,120,72,124,72,135,63,139,54,135,54,124" onclick='clickColor("${send_command}","#99FF33",-80,54)' onmouseover='mouseOverColor("#99FF33")' alt="#99FF33">
      <area style="cursor:pointer" shape="poly" coords="81,120,90,124,90,135,81,139,72,135,72,124" onclick='clickColor("${send_command}","#CCFF66",-80,72)' onmouseover='mouseOverColor("#CCFF66")' alt="#CCFF66">
      <area style="cursor:pointer" shape="poly" coords="99,120,108,124,108,135,99,139,90,135,90,124" onclick='clickColor("${send_command}","#FFFF99",-80,90)' onmouseover='mouseOverColor("#FFFF99")' alt="#FFFF99">
      <area style="cursor:pointer" shape="poly" coords="117,120,126,124,126,135,117,139,108,135,108,124" onclick='clickColor("${send_command}","#FFCC99",-80,108)' onmouseover='mouseOverColor("#FFCC99")' alt="#FFCC99">
      <area style="cursor:pointer" shape="poly" coords="135,120,144,124,144,135,135,139,126,135,126,124" onclick='clickColor("${send_command}","#FF9999",-80,126)' onmouseover='mouseOverColor("#FF9999")' alt="#FF9999">
      <area style="cursor:pointer" shape="poly" coords="153,120,162,124,162,135,153,139,144,135,144,124" onclick='clickColor("${send_command}","#FF6699",-80,144)' onmouseover='mouseOverColor("#FF6699")' alt="#FF6699">
      <area style="cursor:pointer" shape="poly" coords="171,120,180,124,180,135,171,139,162,135,162,124" onclick='clickColor("${send_command}","#FF3399",-80,162)' onmouseover='mouseOverColor("#FF3399")' alt="#FF3399">
      <area style="cursor:pointer" shape="poly" coords="189,120,198,124,198,135,189,139,180,135,180,124" onclick='clickColor("${send_command}","#CC3399",-80,180)' onmouseover='mouseOverColor("#CC3399")' alt="#CC3399">
      <area style="cursor:pointer" shape="poly" coords="207,120,216,124,216,135,207,139,198,135,198,124" onclick='clickColor("${send_command}","#990099",-80,198)' onmouseover='mouseOverColor("#990099")' alt="#990099">
      <area style="cursor:pointer" shape="poly" coords="36,135,45,139,45,150,36,154,27,150,27,139" onclick='clickColor("${send_command}","#666633",-65,27)' onmouseover='mouseOverColor("#666633")' alt="#666633">
      <area style="cursor:pointer" shape="poly" coords="54,135,63,139,63,150,54,154,45,150,45,139" onclick='clickColor("${send_command}","#99CC00",-65,45)' onmouseover='mouseOverColor("#99CC00")' alt="#99CC00">
      <area style="cursor:pointer" shape="poly" coords="72,135,81,139,81,150,72,154,63,150,63,139" onclick='clickColor("${send_command}","#CCFF33",-65,63)' onmouseover='mouseOverColor("#CCFF33")' alt="#CCFF33">
      <area style="cursor:pointer" shape="poly" coords="90,135,99,139,99,150,90,154,81,150,81,139" onclick='clickColor("${send_command}","#FFFF66",-65,81)' onmouseover='mouseOverColor("#FFFF66")' alt="#FFFF66">
      <area style="cursor:pointer" shape="poly" coords="108,135,117,139,117,150,108,154,99,150,99,139" onclick='clickColor("${send_command}","#FFCC66",-65,99)' onmouseover='mouseOverColor("#FFCC66")' alt="#FFCC66">
      <area style="cursor:pointer" shape="poly" coords="126,135,135,139,135,150,126,154,117,150,117,139" onclick='clickColor("${send_command}","#FF9966",-65,117)' onmouseover='mouseOverColor("#FF9966")' alt="#FF9966">
      <area style="cursor:pointer" shape="poly" coords="144,135,153,139,153,150,144,154,135,150,135,139" onclick='clickColor("${send_command}","#FF6666",-65,135)' onmouseover='mouseOverColor("#FF6666")' alt="#FF6666">
      <area style="cursor:pointer" shape="poly" coords="162,135,171,139,171,150,162,154,153,150,153,139" onclick='clickColor("${send_command}","#FF0066",-65,153)' onmouseover='mouseOverColor("#FF0066")' alt="#FF0066">
      <area style="cursor:pointer" shape="poly" coords="180,135,189,139,189,150,180,154,171,150,171,139" onclick='clickColor("${send_command}","#CC6699",-65,171)' onmouseover='mouseOverColor("#CC6699")' alt="#CC6699">
      <area style="cursor:pointer" shape="poly" coords="198,135,207,139,207,150,198,154,189,150,189,139" onclick='clickColor("${send_command}","#993366",-65,189)' onmouseover='mouseOverColor("#993366")' alt="#993366">
      <area style="cursor:pointer" shape="poly" coords="45,150,54,154,54,165,45,169,36,165,36,154" onclick='clickColor("${send_command}","#999966",-50,36)' onmouseover='mouseOverColor("#999966")' alt="#999966">
      <area style="cursor:pointer" shape="poly" coords="63,150,72,154,72,165,63,169,54,165,54,154" onclick='clickColor("${send_command}","#CCCC00",-50,54)' onmouseover='mouseOverColor("#CCCC00")' alt="#CCCC00">
      <area style="cursor:pointer" shape="poly" coords="81,150,90,154,90,165,81,169,72,165,72,154" onclick='clickColor("${send_command}","#FFFF00",-50,72)' onmouseover='mouseOverColor("#FFFF00")' alt="#FFFF00">
      <area style="cursor:pointer" shape="poly" coords="99,150,108,154,108,165,99,169,90,165,90,154" onclick='clickColor("${send_command}","#FFCC00",-50,90)' onmouseover='mouseOverColor("#FFCC00")' alt="#FFCC00">
      <area style="cursor:pointer" shape="poly" coords="117,150,126,154,126,165,117,169,108,165,108,154" onclick='clickColor("${send_command}","#FF9933",-50,108)' onmouseover='mouseOverColor("#FF9933")' alt="#FF9933">
      <area style="cursor:pointer" shape="poly" coords="135,150,144,154,144,165,135,169,126,165,126,154" onclick='clickColor("${send_command}","#FF6600",-50,126)' onmouseover='mouseOverColor("#FF6600")' alt="#FF6600">
      <area style="cursor:pointer" shape="poly" coords="153,150,162,154,162,165,153,169,144,165,144,154" onclick='clickColor("${send_command}","#FF5050",-50,144)' onmouseover='mouseOverColor("#FF5050")' alt="#FF5050">
      <area style="cursor:pointer" shape="poly" coords="171,150,180,154,180,165,171,169,162,165,162,154" onclick='clickColor("${send_command}","#CC0066",-50,162)' onmouseover='mouseOverColor("#CC0066")' alt="#CC0066">
      <area style="cursor:pointer" shape="poly" coords="189,150,198,154,198,165,189,169,180,165,180,154" onclick='clickColor("${send_command}","#660033",-50,180)' onmouseover='mouseOverColor("#660033")' alt="#660033">
      <area style="cursor:pointer" shape="poly" coords="54,165,63,169,63,180,54,184,45,180,45,169" onclick='clickColor("${send_command}","#996633",-35,45)' onmouseover='mouseOverColor("#996633")' alt="#996633">
      <area style="cursor:pointer" shape="poly" coords="72,165,81,169,81,180,72,184,63,180,63,169" onclick='clickColor("${send_command}","#CC9900",-35,63)' onmouseover='mouseOverColor("#CC9900")' alt="#CC9900">
      <area style="cursor:pointer" shape="poly" coords="90,165,99,169,99,180,90,184,81,180,81,169" onclick='clickColor("${send_command}","#FF9900",-35,81)' onmouseover='mouseOverColor("#FF9900")' alt="#FF9900">
      <area style="cursor:pointer" shape="poly" coords="108,165,117,169,117,180,108,184,99,180,99,169" onclick='clickColor("${send_command}","#CC6600",-35,99)' onmouseover='mouseOverColor("#CC6600")' alt="#CC6600">
      <area style="cursor:pointer" shape="poly" coords="126,165,135,169,135,180,126,184,117,180,117,169" onclick='clickColor("${send_command}","#FF3300",-35,117)' onmouseover='mouseOverColor("#FF3300")' alt="#FF3300">
      <area style="cursor:pointer" shape="poly" coords="144,165,153,169,153,180,144,184,135,180,135,169" onclick='clickColor("${send_command}","#FF0000",-35,135)' onmouseover='mouseOverColor("#FF0000")' alt="#FF0000">
      <area style="cursor:pointer" shape="poly" coords="162,165,171,169,171,180,162,184,153,180,153,169" onclick='clickColor("${send_command}","#CC0000",-35,153)' onmouseover='mouseOverColor("#CC0000")' alt="#CC0000">
      <area style="cursor:pointer" shape="poly" coords="180,165,189,169,189,180,180,184,171,180,171,169" onclick='clickColor("${send_command}","#990033",-35,171)' onmouseover='mouseOverColor("#990033")' alt="#990033">
      <area style="cursor:pointer" shape="poly" coords="63,180,72,184,72,195,63,199,54,195,54,184" onclick='clickColor("${send_command}","#663300",-20,54)' onmouseover='mouseOverColor("#663300")' alt="#663300">
      <area style="cursor:pointer" shape="poly" coords="81,180,90,184,90,195,81,199,72,195,72,184" onclick='clickColor("${send_command}","#996600",-20,72)' onmouseover='mouseOverColor("#996600")' alt="#996600">
      <area style="cursor:pointer" shape="poly" coords="99,180,108,184,108,195,99,199,90,195,90,184" onclick='clickColor("${send_command}","#CC3300",-20,90)' onmouseover='mouseOverColor("#CC3300")' alt="#CC3300">
      <area style="cursor:pointer" shape="poly" coords="117,180,126,184,126,195,117,199,108,195,108,184" onclick='clickColor("${send_command}","#993300",-20,108)' onmouseover='mouseOverColor("#993300")' alt="#993300">
      <area style="cursor:pointer" shape="poly" coords="135,180,144,184,144,195,135,199,126,195,126,184" onclick='clickColor("${send_command}","#990000",-20,126)' onmouseover='mouseOverColor("#990000")' alt="#990000">
      <area style="cursor:pointer" shape="poly" coords="153,180,162,184,162,195,153,199,144,195,144,184" onclick='clickColor("${send_command}","#800000",-20,144)' onmouseover='mouseOverColor("#800000")' alt="#800000">
      <area style="cursor:pointer" shape="poly" coords="171,180,180,184,180,195,171,199,162,195,162,184" onclick='clickColor("${send_command}","#993333",-20,162)' onmouseover='mouseOverColor("#993333")' alt="#993333"></map>

      <div id="selectedhexagon" style="visibility: visible; position: relative; width: 21px; height: 21px; background-image: url(&quot;img_selectedcolor.gif&quot;); top: -35px; left: 135px;"></div>
      <div id="divpreview" style="width:120px;margin:auto;border:solid 1px gray;">&nbsp;</div>
    </div>`;
		html = html.replace( /clickColor/g,  this.class_name+".clickColor");
		html = html.replace( /mouseOverColor/g,  this.class_name+".mouseOverColor");
		html = html.replace( /mouseOutMap/g,  this.class_name+".mouseOutMap");
		return html;
		}

	this.mouseOverColor = function(hex) {
		document.getElementById("divpreview").style.visibility = "visible";
		document.getElementById("divpreview").style.backgroundColor = hex;
		document.body.style.cursor = "pointer";
		}

	this.mouseOutMap    = function () {
		if (this.hh == 0) {
		 	document.getElementById("divpreview").style.backgroundColor = "";
			//document.getElementById("divpreview").style.visibility = "hidden";
			} 
		else { this.hh = 0; }
		}

	this.clickColor     = function (send_command, hex, sel_top, sel_left, html5) {

		document.getElementById("divpreview").style.visibility = "visible";
		document.getElementById("divpreview").style.backgroundColor = hex;

		r = parseInt(hex.substr(1,2), 16);
		g = parseInt(hex.substr(3,2), 16);
		b = parseInt(hex.substr(5,2), 16);

        console.log('this.sendColorCode(r+":"+g+":"+b);')
        console.log(r+":"+g+":"+b);

        //this.sendColorCode(r+":"+g+":"+b);
        this.sendColorCode_CIE1931(send_command, r+":"+g+":"+b);
		}


    // color picker visualization v2
    this.colorPickerHTMLv2 = function (container_id, sub_id, send_command, color_model) {

        console.debug("Load Color Picker ("+container_id+") ...");

        var use_image = "rgb";
        var device    = sub_id.replace("_"+send_command, "");

        if (color_model.indexOf("Brightness") > -1)       { use_image = "strip_brightness"; }
        else if (color_model.indexOf("temperature") > -1) { use_image = "strip_temperature"; }
        else if (color_model.indexOf("small") > -1)       { use_image = "strip_rgb"; }
        else if (color_model.indexOf("old") > -1)         { use_image = "old"; }

        var color_picker_images = {
            "rgb":               ['remote-v3/img/rgb2.png', 250, 250],
            "strip_rgb":         ['remote-v3/img/rgb-regenbogen.png', 280, 30],
            "strip_temperature": ['remote-v3/img/color-temp.png', 280, 30],
            "strip_brightness":  ['remote-v3/img/brightness.png', 280, 30],
            "old":               ['remote-v3/img/img_colormap.gif', 234, 199]
        }

        // Get the canvas element and its context
        const color_demo         = document.getElementById("colorpicker_demo_" + sub_id);
        const canvas             = document.getElementById(container_id);
        const ctx                = canvas.getContext('2d');
        const color_send_command = send_command;

        // Load image
        const image  = new Image();
        image.src    = color_picker_images[use_image][0]; // Replace 'image.jpg' with your image path
        image.width  = color_picker_images[use_image][1];
        image.height = color_picker_images[use_image][2];

        if (image.height == 30) {
            color_demo.style.width  = "10px";
            color_demo.style.height = "28px";
            color_demo.style.background = "2px solid white";
            }
        else {
            color_demo.style.width  = image.width + "px";
            color_demo.style.height = "10px";
            color_demo.style.background = "2px solid gray";
            }

        // When the image is loaded, draw it on the canvas
        image.onload = function() {
            canvas.width  = image.width;
            canvas.height = image.height;
            canvas.style.borderRadius = "5px";
            ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
            //ctx.drawImage(image, 0, 0, image.width, image.height);
            console.debug("Color picker canvas size: " + canvas.width + "x" + canvas.height);
        };

        // Event listener for click on the canvas
        canvas.addEventListener('click', function(event) {
            // Get the clicked pixel data
            var x = event.offsetX;
            var y = event.offsetY;
            const pixelData = ctx.getImageData(x, y, 1, 1).data;

            // Extract RGB values
            const red   = pixelData[0];
            const green = pixelData[1];
            const blue  = pixelData[2];
            const value = Math.round(x / canvas.width * 1000) / 10;

            // Display RGB values
            console.debug("PIXEL DATA: " + pixelData);
            console.debug(`PIXEL DATA: X: ${x}, Y: ${y} | R: ${red}, G: ${green}, B: ${blue} | value: ${value}`);
            color_demo.style.backgroundColor = "rgb("+red+","+green+","+blue+")";

            var input = `${red}:${green}:${blue}`;
            if (color_model.indexOf("CIE_1931") > -1)          { rm3remotes.color_picker.sendColorCode_CIE1931(color_send_command, input); }
            else if (color_model.indexOf("temperature") > -1)  { rm3remotes.color_picker.sendColorCode_temperature(color_send_command, value, device); }
            else if (color_model.indexOf("Brightness") > -1)   { rm3remotes.color_picker.sendColorCode_brightness(color_send_command, value, device); }
            else                                               { rm3remotes.color_picker.sendColorCode(color_send_command, input); }
        });


    }


    // send commands depending on color model
	this.sendColorCode              = function (send_command, input) {

		appFW.requestAPI('GET',[ 'send-data', this.active_name, send_command, '"'+input+'"'	 ], '','');
		}

    this.sendColorCode_CIE1931      = function (send_command, input) {

        rgb_color = input.split(":");
        xy_color  = this.RGB_to_XY(rgb_color);
        input     = xy_color[0] + ":" + xy_color[1];
        console.error("CIE 1931 XY coordinates: " + input + " / " + this.class_name);

		appFW.requestAPI('GET',[ 'send-data', this.active_name, send_command, '"'+input+'"' ], '','');
    }

    this.sendColorCode_brightness   = function (send_command, input, device) {
        var pure_cmd = send_command.replace("send-", "");
        var min_max  = dataAll["CONFIG"]["devices"][device]["commands"]["definition"][pure_cmd]["values"];
        var type     = dataAll["CONFIG"]["devices"][device]["commands"]["definition"][pure_cmd]["type"];
        if (min_max == undefined || min_max["min"] == undefined || min_max["max"] == undefined) {
            appMsg.info("Could not set brightness: no min-max values for " + device + " / " + pure_cmd + ".  Check remote configuration!","error");
            console.error(dataAll["CONFIG"]["devices"][device]["commands"]["definition"][pure_cmd]);
            console.error(min_max["min"]);
            }
        else {
            var range = min_max["max"] - min_max["min"];
            var value = (range * input) / 100 + min_max["min"];
            if (type == "integer") { value = Math.round(value); }
            console.log("BRIGHTNESS: " + send_command + " / " + input + " / min=" + min_max["min"] + "; max=" + min_max["max"] + " / " + value);
            console.debug(min_max);
            appFW.requestAPI('GET',[ 'send-data', this.active_name, send_command, value ], '','');
            }
        }

    this.sendColorCode_temperature  = function (send_command, input, device) {
        var pure_cmd = send_command.replace("send-", "");
        var min_max  = dataAll["CONFIG"]["devices"][device]["commands"]["definition"][pure_cmd]["values"];
        var type     = dataAll["CONFIG"]["devices"][device]["commands"]["definition"][pure_cmd]["type"];
        if (min_max == undefined || min_max["min"] == undefined || min_max["max"] == undefined) {
            appMsg.info("Could not set color temperature: no min-max values for " + device + " / " + pure_cmd + ". Check remote configuration!","error");
            console.error(dataAll["CONFIG"]["devices"][device]["commands"]["definition"][pure_cmd]);
            }
        else {
            var range = min_max["max"] - min_max["min"];
            var value = (range * input) / 100 + min_max["min"];
            if (type == "integer") { value = Math.round(value); }
            console.log("TEMPERATURE: " + send_command + " / " + input + " / min=" + min_max["min"] + "; max=" + min_max["max"] + " / " + value);
            console.debug(min_max);
            appFW.requestAPI('GET',[ 'send-data', this.active_name, send_command, value ], '','');
            }
        }


    // Function to convert RGB to XY
    this.RGB_to_XY = function (rgb) {

        var red = rgb[0];
        var green = rgb[1];
        var blue = rgb[2];

        //Apply a gamma correction to the RGB values, which makes the color more vivid and more the like the color displayed on the screen of your device
        var red 	= (red > 0.04045) ? Math.pow((red + 0.055) / (1.0 + 0.055), 2.4) : (red / 12.92);
        var green 	= (green > 0.04045) ? Math.pow((green + 0.055) / (1.0 + 0.055), 2.4) : (green / 12.92);
        var blue 	= (blue > 0.04045) ? Math.pow((blue + 0.055) / (1.0 + 0.055), 2.4) : (blue / 12.92);

        //RGB values to XYZ using the Wide RGB D65 conversion formula
        var X 		= red * 0.664511 + green * 0.154324 + blue * 0.162028;
        var Y 		= red * 0.283881 + green * 0.668433 + blue * 0.047685;
        var Z 		= red * 0.000088 + green * 0.072310 + blue * 0.986039;

        //Calculate the xy values from the XYZ values
        var x 		= (X / (X + Y + Z)).toFixed(4);
        var y 		= (Y / (X + Y + Z)).toFixed(4);

        if (isNaN(x))
            x = 0;
        if (isNaN(y))
            y = 0;
        return [x, y];
        }
	}
