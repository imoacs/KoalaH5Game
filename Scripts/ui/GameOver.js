var GameOver = qc.defineBehaviour('qc.Koala.ui.GameOver', qc.Behaviour, function() {
}, {
    // 重新开始游戏按钮
    restartBtn : qc.Serializer.NODE,
    // 分享按钮
    shareBtn : qc.Serializer.NODE,
    // 更逗游戏按钮
    moreBtn : qc.Serializer.NODE,
    // 排行榜按钮
    rankBtn : qc.Serializer.NODE,
    // 记录更新
    goalSign : qc.Serializer.NODE,
    // 当前分数文本
    scoreLabel : qc.Serializer.NODE,
    // 最高分文本
    bestLabel : qc.Serializer.NODE,
    // 世界排名百分比
    percentLabel : qc.Serializer.NODE
});

GameOver.prototype.awake = function() {
    // 监听游戏结束事件
    this.addListener(qc.Koala.onGameOver, this.show, this);

    // 监听重新开始游戏点击事件
    this.addListener(this.restartBtn.onClick, this.onRestartBtnClick, this);

    // 监听分享按钮点击事件
    this.addListener(this.shareBtn.onClick, function() {
        qc.Koala.showShareMsg.dispatch();
    }, this);

    // 监听更多游戏按钮点击事件
    this.addListener(this.moreBtn.onClick, function() {
        document.location.href = qc.Koala.logic.config.followHref;
    }, this);

    // 监听排行榜按钮点击事件
    this.addListener(this.rankBtn.onClick, this.onRankBtnClick, this);
};

/**
 * 初始化界面
 */
GameOver.prototype.initUI = function() {
    if (qc.Koala.logic.me.score === qc.Koala.logic.me.best) {
        this.goalSign.visible = true;

        // 判断当前分数是否超过历史最高分数
        qc.Interactive.updateScorers(
            qc.Koala.logic.me.rid,
            qc.Koala.logic.me.token,
            qc.Koala.logic.me.best,
            function(data) {
                // 更新分数成功
                console.log("更新分数成功");
            }
        );
    }
    else {
        this.goalSign.visible = false;
    }

    var score = qc.Koala.logic.me.score
    this.scoreLabel.text = score + '';

    this.bestLabel.text = '最高分：' + qc.Koala.logic.me.best;

    var percent = qc.Koala.logic.percent.getPercent(score);
    this.percentLabel.text = '你击败了全球' + percent + '%的玩家';
};

/**
 * 重新开始游戏按钮点击后处理
 */
GameOver.prototype.onRestartBtnClick = function() {
    // 派发游戏开始事件，并指定为重新开始
    qc.Koala.onStart.dispatch(true);
    // 隐藏死亡界面
    this.hide();
};

/**
 * 排行榜按钮点击后处理
 */
GameOver.prototype.onRankBtnClick = function () {
    if (qc.Koala.logic.me.userInfo &&
        qc.Koala.logic.me.userInfo.subscribe) {
        qc.Koala.onRankingClose.addOnce(this.show, this);

        qc.Koala.showRanking.dispatch();

        this.hide();
    }else{
        //显示关注界面
        qc.Koala.showFollowMsg.dispatch();
    }
};

/**
 * 显示界面
 */
GameOver.prototype.show = function () {
    this.initUI();
    this.gameObject.visible = true;
};

/**
 * 隐藏界面
 */
GameOver.prototype.hide = function () {
    this.gameObject.visible = false;
};
