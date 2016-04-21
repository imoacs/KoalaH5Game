var PillarInfo = function(row) {
	this.id = row.id * 1;
	this.minLv = row.minLv * 1;
	this.maxLv = row.maxLv * 1 || Infinity;
	this.thickness = row.thickness * 1;
	this.top = row.top * 1;
	this.headIcon = row.headIcon;
	this.scoreRect = row.scoreRect * 1 || Infinity;
};

var Pillar = qc.Koala.logic.Pillar = function(excel) {
	// 柱子信息列表
	this.infoList = [];

	// 关卡与柱子粗细值对应表
	this.infoMap = {};

	if (!excel) {
		excel = qc.Koala.game.assets.load('config');
	}

	var sheet = excel.findSheet('pillar');
	if (sheet) {
		sheet.rows.forEach(function(row) {
			this.infoList.push(new PillarInfo(row));
		}, this);
	}
};

/**
 * 获取柱子粗细值
 * @return {number}
 */
Pillar.prototype.getInfo = function(level) {
	var info = this.infoMap[level];
	if (!info) {
		var p = this._find(level);
		info = {
			thickness : qc.Koala.logic.config.pillarWidth,
			top : qc.Koala.logic.config.pillarTopMin,
			headIcon : qc.Koala.logic.config.pillarHeadIcon,
			scoreRect : Infinity
		};
		if (p) {
			info.thickness *= p.thickness;
			info.top = p.top * qc.Koala.logic.config.pillarTopMax;
			info.headIcon = p.headIcon;
			info.scoreRect = p.scoreRect;
		}
		this.infoMap[level] = info;
	}
	return info;
};

/**
 * 遍历获取柱子粗细百分比
 * @param  {number} level - 关卡数
 * @return {number}
 */
Pillar.prototype._find = function(level) {
	for (var i = 0, len = this.infoList.length; i < len; i++) {
		var info = this.infoList[i];
		if (level < info.minLv)
			continue;
		if (level >= info.minLv && level <= info.maxLv)
			return info;
	}
	return null;
};
