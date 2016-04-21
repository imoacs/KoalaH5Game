var Ranking = qc.defineBehaviour('qc.Koala.ui.Ranking', qc.Behaviour, function() {
    this._rankingData = [];

    this._iconKeyList = [];
}, {
    rankingList : qc.Serializer.NODE,
    rankingRowPrefab : qc.Serializer.PREFAB,
    ownRanking : qc.Serializer.NODE,
    waiting : qc.Serializer.NODE,
    closeBtn : qc.Serializer.NODE
});

Ranking.prototype.awake = function () {
    this.addListener(qc.Koala.showRanking, this.show, this);

    this.addListener(this.closeBtn.onClick, this.close, this);
};

Ranking.prototype.getRanking = function () {
    // TODO 获取排行榜数据，监听到获取成功，调用getRankingSuccess方法
    var self = this;
    var me = qc.Koala.logic.me;
    qc.Interactive.getRank(me.rid, me.token, me.channel, function(data) {
        data = JSON.parse(data);
        var rank = 0;
        var rankTop = data.rankTop;
        for (var i = 0; i < rankTop.length; i++) {
            var u = rankTop[i];
            if (u.rid === me.rid) {
                rank = i + 1;
            }
            u.ranking = i + 1;
        }
        data.selfRank = data.userData[0];
        if (data.selfRank)
            data.selfRank.ranking = rank;

        self.getRankingSuccess(data);
    });
};

Ranking.prototype.getRankingSuccess = function (data) {
    this.waiting.stop();
    this.waiting.visible = false;

	// 初始化排行榜列表
    var n = this.rankingList.getScript('qc.Koala.ui.RankData');
    n.rankData = data.rankTop;
    n.dispatchDataChange();


	// 初始化我的排名
	this.initOwnRanking(data.selfRank);
};

Ranking.prototype.initOwnRanking = function (row) {
    var s = this.ownRanking.getScript('qc.Koala.ui.RankingRow');
    s.init(row);

    this.ownRanking.visible = true;
};

Ranking.prototype.show = function () {
    this.gameObject.visible = true;

    this.waiting.visible = true;
    this.waiting.playAnimation('zhuan', null, true);

    this.getRanking();
};

Ranking.prototype.close = function () {
    this.gameObject.visible = false;
    this._rankingData.length = 0;

    this._iconKeyList.forEach(function(icon) {
		this.game.assets.unload(icon);
	}, this);

    this._iconKeyList.length = 0;

    //this.rankingList.content.removeChildren();

    qc.Koala.onRankingClose.dispatch();
};
