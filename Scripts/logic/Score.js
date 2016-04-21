var ScoreInfo = function(row) {
    this.id = row.id * 1;
    this.min = row.min * 1;
    this.max = row.max * 1;
    this.value = row.value * 1;

    this.scoreImg = row.scoreImg;
    this.labelImg = row.labelImg;

    this.effectName = row.effectName;
};

var Score = qc.Koala.logic.Score = function(excel) {
    // 分数信息列表
	this.infoList = [];

    // 默认的分数信息
    this.defaultInfo = null;

	if (!excel) {
		excel = qc.Koala.game.assets.load('config');
	}

	var sheet = excel.findSheet('score');
	if (sheet) {
		sheet.rows.forEach(function(row) {
			this.infoList.push(new ScoreInfo(row));
		}, this);
	}
};

/**
 * 获取分数
 * @param  {number} distance - 考拉降落点到柱子中心的距离
 * @param  {number} scoreRect - 柱子的分数区域
 * @return {number}
 */
Score.prototype.getScore = function(distance, scoreRect) {
    console.log('scoreRect:',scoreRect);
    // 如果超出分数区域，则返回游戏最小分
    if (distance > scoreRect) {
        if (!this.defaultInfo)
            this.defaultInfo = {
                value : qc.Koala.logic.config.minScore,
                labelImg : qc.Koala.logic.config.labelImg,
                scoreImg : qc.Koala.logic.config.scoreImg
            };
        return this.defaultInfo;
    }

    // 通过距离计算得分
    var info = null;
    for (var i = 0, len = this.infoList.length; i < len; i++) {
        info = this.infoList[i];
        if (distance > info.min && distance <= info.max)
            break;
    }
    return info;
};
