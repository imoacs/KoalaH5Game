var ShareInfo = function(data) {
	this.id = data.id * 1;
	this.min = data.min * 1;
	this.max = data.max * 1;
	this.max = this.max == null ? Infinity : this.max;
	this.content = data.content;
};

var Share = qc.Koala.logic.Share = function(excel) {
	this.shareMap = {};

	if (!excel)
        excel = qc.Island.game.assets.find('config');

    var sheet = excel.findSheet('share');

    for (var i in sheet.rows) {
        var row = sheet.rows[i];
        this.shareMap[row.id] = new ShareInfo(row);
    }

	//qc.Koala.onScoreChange.add(this.share, this);
};

Share.prototype = {};
Share.prototype.constructor = Share;

Share.prototype.getContent = function(score) {
	for (var key in this.shareMap) {
		var info = this.shareMap[key];
		if (score >= info.min && score <= info.max) {
			return info.content.replace('{0}', score);
		}
	}
};

//Share.prototype.share = function(score) {
//    //var content = this.getContent(score);
//	//if (qc.qcWeChat) {
//	//	qc.qcWeChat.share(
//     //       content,
//	//		qc.Koala.logic.config.shareIcon,
//	//		'',
//	//		qc.Koala.logic.config.shareDir
//	//	);
//	//}
//};
