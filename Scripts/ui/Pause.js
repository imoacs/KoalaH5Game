var Pause = qc.defineBehaviour('qc.Koala.ui.Pause', qc.Behaviour, function() {
}, {
    // 继续游戏按钮
    continueBtn : qc.Serializer.NODE,
    restartBtn : qc.Serializer.NODE,
    shareBtn : qc.Serializer.NODE,
    moreBtn : qc.Serializer.NODE,
    rankBtn : qc.Serializer.NODE
});

/**
 * 初始化
 */
Pause.prototype.awake = function() {
    var self =this;
    // 监听游戏暂停事件
    this.addListener(qc.Koala.onPause, this.show, this);

    // 监听继续游戏按钮点击事件
    this.addListener(this.continueBtn.onClick, this.onContinueBtnClick, this);

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

/** 重新开始游戏按钮点击后处理 */
Pause.prototype.onRestartBtnClick = function() {
    // 派发游戏开始事件，并指定为重新开始
    qc.Koala.onStart.dispatch(true);
    // 隐藏死亡界面
    this.hide();
};

/**
 * 继续游戏按钮点击后处理
 */
Pause.prototype.onContinueBtnClick = function() {
    // 设置游戏暂停状态
    qc.Koala.logic.me.paused = false;

    // 派发继续游戏事件
    qc.Koala.onContinue.dispatch();

    // 隐藏界面
    this.hide();
};

/**
 * 排行榜按钮点击事件后处理
 */
Pause.prototype.onRankBtnClick = function () {
    if (qc.Koala.logic.me.userInfo &&
        qc.Koala.logic.me.userInfo.subscribe) {
        qc.Koala.onRankingClose.addOnce(this.show, this);

        qc.Koala.showRanking.dispatch();

        this.hide();
    }
    else {
        //显示关注界面
        qc.Koala.showFollowMsg.dispatch();
    }
};

/**
 * 显示界面
 */
Pause.prototype.show = function () {
    this.gameObject.visible = true;
};

/**
 * 隐藏界面
 */
Pause.prototype.hide = function () {
    this.gameObject.visible = false;
};
