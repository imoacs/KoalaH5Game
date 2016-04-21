<?php
header("Cache-Control: no-cache, must-revalidate"); 	

// 游戏名字需要添加
$gameName = "Koala";
// 游戏URL需要更改
$gameUrl = "http://engine.zuoyouxi.com/game/Koala/index.php";

require_once '../../game/newphp/logicphp/dataBase.php';
require_once '../../game/newphp/logicphp/func.php';
importDateBase(false, $gameName);
require_once '../../game/newphp/logicphp/wxCodeCheck.php';
require_once '../../game/newphp/wx/share/include/app_info.php';
require_once '../../game/newphp/wx/game/config.php';
require_once '../../game/newphp/logicphp/lib/SnsNetwork.php';
require_once '../../game/newphp/wx/share/include/log.php';

$appid = APPID;
$secret = APP_SECRET;

$user_agent = $_SERVER['HTTP_USER_AGENT'];
if (strpos($user_agent, 'MicroMessenger') !== false) {
	$code = isset($_REQUEST['code']) ? $_REQUEST['code'] : "";
// 	$secret = AppInfo::query ( $appid );
	// 检查是否配置appid
	if (!isset($appid) || !isset($secret)) {
		die("appid or secret is null");
	}
	codeCheck($gameUrl, $appid, $secret, $code);
}

?>
<!DOCTYPE html>
<html manifest="qici.appcache">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
    <meta name='viewport' content='width=device-width,user-scalable=no'>
    <meta name='apple-mobile-web-app-status-bar-style' content='black-translucent'>
    <meta name='apple-mobile-web-app-capable' content='yes'>
    <meta name='apple-mobile-web-app-title' content='悠悠考拉'>
    <link rel='apple-touch-icon' href='http://engine.zuoyouxi.com/qici.png'>
    <link rel='apple-touch-startup-image' href='http://engine.zuoyouxi.com/qici.png'>

    <link rel="shortcut icon" href="http://engine.zuoyouxi.com/qici.ico" />
    <title>悠悠考拉</title>
    <style>
        html, body {
            padding: 0;
            margin: 0;
            width: 100%;
            height: 100%;
        }
    </style>
    <link rel="stylesheet" type="text/css" href="./Assets/css/style.css?v=20160119134604"/>

    <script>
        // The game configuration
        var qici = {};
        qici.config = {
            projectName: 'Koala',
            gameName: '悠悠考拉',
            companyName: 'qici',
            bundleIdentifier: 'com.qici.Koala',
            gameInstance: 'qc_game',
            frameRate: {"mobile":60,"desktop":60},
            backgroundColor: 0,
            runInBackground: true,
            antialias: true,
            transparent: false,
            developerMode: false,
            resolution : Math.min(2, devicePixelRatio),
            renderer: 'Canvas',
            loadingPrefab: '',
            scene: {

            "main" : "Assets/state/main.bin"
            },
            entryScene : 'main',
            dirtyRectangles: true,
            loading: {
                loadingText: '资源加载中，请稍候...',
                loadingInterval: 200,
                brightingInterval: 10,
                blinkingCount: 5,
                blinkingInterval: 70,
                fadingInInterval: 400,
                fadingOutInterval: 600
            }
        };

 		_pluginVariables_={}

        qici.scripts = [
            './Assets/meta/globalUrlMap.js?v=20160119134604',
            'http://engine.zuoyouxi.com/lib/1.0.6/phaser.min.js',
            'http://engine.zuoyouxi.com/lib/1.0.6/webfontloader.js',
            'http://engine.zuoyouxi.com/lib/1.0.6/qc-core.js',
            'http://engine.zuoyouxi.com/lib/qc-webgl.js?v=1',
            // External scripts for plugins

            // User scripts
            './js/game-scripts-mini-0.1.js?v=20160119134604'
        ];

		// Asset count that need preload in boot
		qici.loadingAssetCount = 43;
    </script>
</head>

<body onload="qici.init();">
    <div style="overflow:hidden;padding:0;margin:0;width:100%;height:100%;">
        <div id="gameDiv" style="position:relative;"></div>
    </div>
    <script src='http://engine.zuoyouxi.com/lib/1.0.6/qc-loading.js'></script>
    <!-- CNZZ 统计 -->
	<div style="display:none;">
		<script src="http://s11.cnzz.com/z_stat.php?id=1257109454&web_id=1257109454" language="JavaScript"></script>
	</div>
</body>

</html>
