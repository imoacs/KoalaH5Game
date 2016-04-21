/**
 * @author luohj version 03.2
 * @copyright 2015 Qcplay All Rights Reserved.
 */

var Interactive = qc.defineBehaviour('qc.Interactive', qc.Behaviour, function() {
    qc.interactive = this;
}, {
    gameName: qc.Serializer.STRING,
    serverUrl: qc.Serializer.STRING
});

/**
 * 上传分数
 * @param {string} rid - 用户唯一标示
 * @param {string} token - 当前登陆用户的临时标示
 * @param {number} scorers - 分数
 * @param {func} callbackFunc - 回调函数
 */
Interactive.updateScorers = function(rid, token, scorers, callbackFunc, onerror) {
    var url = qc.interactive.serverUrl + "updateScorers03.php";
    url += "?rid=" + rid;
    url += "&token=" + token;
    url += "&scorers=" + scorers;
    url += "&gameName=" + qc.interactive.gameName;

    qc.AssetUtil.get(url, callbackFunc, onerror);
};

/**
 * 获取排行榜
 * @param {string} rid - 用户唯一标示
 * @param {string} token - 当前登陆用户的临时标示
 * @param {string} channel - 渠道
 * @param {func} callbackFunc - 回调函数
 */
Interactive.getRank = function(rid, token, channel, callbackFunc, onerror) {
    var url = qc.interactive.serverUrl + "getRank03.php";
    url += "?rid=" + rid;
    url += "&token=" + token;
    url += "&channel=" + channel;
    url += "&gameName=" + qc.interactive.gameName;

    qc.AssetUtil.get(url, callbackFunc, onerror);
};
