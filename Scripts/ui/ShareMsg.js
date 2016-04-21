var ShareMsg = qc.defineBehaviour('qc.Koala.ui.ShareMsg', qc.Behaviour, function() {
}, {
    // 箭头
    arrow : qc.Serializer.NODE,
    // 文本
    msgLabel : qc.Serializer.NODE
});

ShareMsg.prototype.awake = function () {
    this.addListener(qc.Koala.showShareMsg, this.show, this);
};

/**
 * 初始化界面
 */
ShareMsg.prototype.init = function() {
    this.arrow.visible = qc.qcWeChat.isWeChat();
    if (this.arrow.visible)
        this.msgLabel.text = '点击右上角\n分享给您的好友们吧\n看看他们能取得多少分';
    else
        this.msgLabel.text = '请使用分享功能\n告诉给您的好友们吧\n看看他们能取得多少分';
};

/**
 * 监听页面点击事件
 */
ShareMsg.prototype.onClick = function() {
    this.hide();
};

/**
 * 隐藏界面
 */
ShareMsg.prototype.hide = function () {
    this.gameObject.visible = false;
};

/**
 * 显示界面
 */
ShareMsg.prototype.show = function () {
    this.init();
    this.gameObject.visible = true;
};
