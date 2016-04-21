var PercentInfo = function(row) {
    this.id = row.id * 1;
    this.min = row.min * 1;
    this.max = row.max * 1 || Infinity;
    this.base = row.base * 1;
    this.space = row.space * 1;
    this.increment = row.increment * 1;
};

var Percent = qc.Koala.logic.Percent = function(excel) {
    // 百分比信息列表
	this.infoList = [];

	if (!excel) {
		excel = qc.Koala.game.assets.load('config');
	}

	var sheet = excel.findSheet('percent');
	if (sheet) {
		sheet.rows.forEach(function(row) {
			this.infoList.push(new PercentInfo(row));
		}, this);
	}
};

Percent.prototype = {};
Percent.prototype.constructor = Percent;

/**
 * 获取世界排名百分比
 * @param  {number} score - 当前分数
 */
Percent.prototype.getPercent = function (score) {
    var info = null;
    for (var i = 0, len = this.infoList.length; i < len; i++) {
        info = this.infoList[i];
        if (score > info.min && score <= info.max)
            break;
    }

    if (info.space === 0)
        return info.base;

    var percent = info.base;
    percent += Math.floor((score - info.min) / info.space) * info.increment;
    return percent;
};
