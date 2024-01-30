$(`<iframe id="doomedroll" name="Doom" title="You can play Doom in roll20" srcdoc="
<html lang='en-us'>
  <head>
    <meta charset='utf-8'>
    <meta http-equiv='Content-Type' content='text/html; charset=utf-8'>
    <title>js-dos api</title>
    <style type='text/css'>
      body {background:black; }
      .dosbox-container { width: 640px; height: 400px; }
      .dosbox-container > .dosbox-overlay { background: url(https://js-dos.com/cdn/DOOM.png); }
    </style>
  </head>
  <body>
    <div id='dosbox' style='margin:auto; width:640px; overflow:hidden'></div>
    
    <script type='text/javascript' src='https://js-dos.com/cdn/js-dos-api.js'></script>
    <script type='text/javascript'>
      var dosbox = new Dosbox({
        id: 'dosbox',
        onload: function (dosbox) {
          dosbox.run('https://js-dos.com/cdn/upload/DOOM-@evilution.zip', './DOOM/DOOM.EXE');
        },
        onrun: function (dosbox, app) {
          console.log('App ' + app + ' is runned');
        }
      });
    </script>
  </body>
</html>
">Is it working yet?</iframe>`)
	.dialog({
		resizable: true,
		width: 700,
		height: 500,
    zIndex: 200000,
		autoopen: true,
		title: "Play DOOM in roll20!",
		close: () => {$("#doomedroll").off(); $("#doomedroll").dialog("destroy").remove() }
	})
