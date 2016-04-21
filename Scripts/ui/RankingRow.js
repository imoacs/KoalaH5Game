var RankingRow = qc.defineBehaviour('qc.Koala.ui.RankingRow', qc.Behaviour, function() {

}, {
    rankingLabel : qc.Serializer.NODE,
    headIcon : qc.Serializer.NODE,
    nameLabel : qc.Serializer.NODE,
    score : qc.Serializer.NODE
});

// 1, 2, 3名对应的排名文本相关颜色
RankingRow.COLORMAP = {
    '1' : { color : new qc.Color('#F9FB02'), stroke : new qc.Color('#860001') },
    '2' : { color : new qc.Color('#C5C6C1'), stroke : new qc.Color('#3A3436') },
    '3' : { color : new qc.Color('#FEB266'), stroke : new qc.Color('#591B02') }
};

// 排行榜默认的排名文本相关颜色
RankingRow.DEFAULTCOLOR = { color : new qc.Color('#FFFFFF'), stroke : new qc.Color('#A00F0A') };

RankingRow.prototype.init = function(row) {
    // 获取用户数据，并设置用户名和分数
	this.nameLabel.text = row.name;
	this.score.text = row.scorers + '';

	// 加载图片资源
	var url = row.headurl;
    var headIcon = this.headIcon;
    if (url)
	    this.game.assets.loadTexture(row.rid, url, function(texture) {
	        headIcon.texture = texture;
	    });

	// 获取名次
	var ranking = row.ranking || '100+',
		rankLabel = ranking + '',
        color = RankingRow.DEFAULTCOLOR;

	// 1,2,3名分别设置不同的排名文本颜色
	if (ranking <= 3) {
        // 获取文本内容及文本相关颜色
        rankLabel = 'NO.' + ranking;
        color = RankingRow.COLORMAP[ranking];
	}
    else {
        // 设置排名文本字体大小
        this.rankingLabel.fontSize = 52;
    }

    // 设置排名文本颜色及描边颜色
    this.rankingLabel.color = color.color;
    this.rankingLabel.stroke = color.stroke;
    this.rankingLabel.strokeThickness = 3;

	// 设置名次文本
	this.rankingLabel.text = rankLabel;
};
