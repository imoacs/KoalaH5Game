var WindInfo = function(row) {
    this.id = row.id * 1;
    this.minLv = row.minLv * 1;
    this.maxLv = row.maxLv * 1 || Infinity;
    this.minWind = row.minWind * 1;
    this.maxWind = row.maxWind * 1;
};

var Wind = qc.Koala.logic.Wind = function(excel) {
    // 风力信息列表
	this.infoList = [];

    // 风力范围速查表
    this.infoMap = {};

	if (!excel) {
		excel = qc.Koala.game.assets.load('config');
	}

	var sheet = excel.findSheet('wind');
	if (sheet) {
		sheet.rows.forEach(function(row) {
			this.infoList.push(new WindInfo(row));
		}, this);
	}
};

/**
 * 获取风力方向及大小
 * @param  {number} level - 关卡值
 * @return {object}
 *         direction : 方向，-1：向左，1：向右
 *         value : 风力值，0 ~ 100 之间的整数
 */
Wind.prototype.getWind = function(level) {
    // 从速查表中获取风力信息
    var info = this.infoMap[level],
        dir = qc.Koala.Math.random(0, 1);
    // 随机风向
    dir = (dir === 0 ? -1 : dir);
    if (!info) {
        // 遍历风力值列表
        for (var i = 0, len = this.infoList.length; i < len; i++) {
            info = this.infoList[i];
            if (level >= info.minLv && level <= info.maxLv) {
                // 将风力值信息缓存到速查表中
                this.infoMap[level] = info;
                break;
            }
        }
    }

    // 返回风向及风力值
    return {
        direction : dir,
        value : qc.Koala.Math.random(info.minWind, info.maxWind)
    };
};
