var FollowMsg = qc.defineBehaviour('qc.Koala.ui.FollowMsg', qc.Behaviour, function() {
}, {
    label : qc.Serializer.NODE,
    followBtn : qc.Serializer.NODE,
    closeBtn : qc.Serializer.NODE
});

FollowMsg.prototype.awake = function() {
    // 监听关注按钮点击事件
    this.addListener(this.followBtn.onClick, this._follow, this);

    // 监听关闭按钮点击事件
    this.addListener(this.closeBtn.onClick, this.hide, this);

    // 监听显示关注页面事件
    this.addListener(qc.Koala.showFollowMsg, this.show, this);
};

/**
 * 初始化文本
 */
FollowMsg.prototype.initLabel = function () {
    if (qc.qcWeChat.isWeChat() &&
        qc.Koala.logic.me.userInfo &&
        !qc.Koala.logic.me.userInfo.subscribe) {
        this.label.text = '亲，需要[#76ffef]关注公众号[-]后才能查看排行榜哦！';
    }
    else {
        this.label.text = '亲，你要[#76ffef]关注公众号[-]并通过[#76ffef]微信登录[-]，才能查看排行榜哦！';
    }
};

/**
 * 关注公众号
 */
FollowMsg.prototype._follow = function () {
    document.location.href = qc.Koala.logic.config.followHref;
};

/**
 * 隐藏界面
 */
FollowMsg.prototype.hide = function() {
    this.gameObject.visible = false;
};

/**
 * 显示界面
 */
FollowMsg.prototype.show = function () {
    this.gameObject.visible = true;

    this.initLabel();
};
