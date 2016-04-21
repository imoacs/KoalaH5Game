var Welcome = qc.defineBehaviour('qc.Koala.ui.Welcome', qc.Behaviour, function() {
}, {
	// 快速登录按钮
	quickBtn : qc.Serializer.NODE,
	// 微信登录按钮
	wechatBtn : qc.Serializer.NODE,
	// 配置文件
	config : qc.Serializer.EXCELASSET,
	// 登录提示区域
	loginMask : qc.Serializer.NODE
});

Welcome.prototype.awake = function() {
	// 初始化逻辑脚本
	qc.Koala.initLogic(this.config, this.game);

	// 监听快速登录事件
	this.addListener(this.quickBtn.onClick, this._onStart, this);

	// 监听微信登录按钮点击事件
	this.addListener(this.wechatBtn.onClick, this._wechatLogin, this);

	// 监听正在登录中事件
	this.addListener(qc.Koala.onLogining, this._logining, this);

	// 监听登录失败事件
	this.addListener(qc.Koala.onLoginFail, this._loginFail, this);

	// 监听登录成功事件
	this.addListener(qc.Koala.onLogin, this.hide, this);

	// 获取微信插件对象
	var wx = this.getScript('qc.QcWeChat');

	// 设置快速登录按钮的可见情况
	this.quickBtn.visible = !wx.isWeChat();

	// 重新布局按钮
	this.quickBtn.parent.getScript('qc.TableLayout').rebuildTable();

	// 监听开始登录事件
	this.addListener(wx.onStartLogin, function() {
		qc.Koala.onLogining.dispatch();
	}, this);

    // 设置微信登陆结果监听
    this.addListener(wx.onLogin, function(flag) {
		if (flag === "success") {
			this._loginSuccess();
		}
		else {
			// 派发登录失败事件
			qc.Koala.onLoginFail.dispatch();
		}
	}, this);

	// 监听用户点击分享
	this.addListener(wx.onShare, function(body) {
		body.title = qc.Koala.logic.share.getContent(qc.Koala.logic.me.score);
		body.imgUrl = qc.Koala.logic.config.shareIcon;
		body.desc = "";
	}, this);

    //// 设置微信分享
    //qc.Koala.logic.share.share(qc.Koala.logic.me.score);
};

Welcome.prototype._onStart = function() {
	qc.Koala.onStart.dispatch();
	this.hide();
};

Welcome.prototype._wechatLogin = function () {
	//微信登陆
	this.getScript('qc.QcWeChat').login();
};

/**
 * 微信登录成功回调
 */
Welcome.prototype._loginSuccess = function () {
	var wx = this.getScript('qc.QcWeChat');
	if (wx.user) {
		qc.Koala.logic.me.token = wx.user.token;
		qc.Koala.logic.me.rid = wx.user.rid;
		qc.Koala.logic.me.userInfo = wx.user;
	}
	// 设置为微信渠道
	qc.Koala.logic.me.channel = "weixin";

	// 开始游戏
	this._onStart();

	// 校正最高分
	qc.Koala.logic.me.adjustBest();
};

Welcome.prototype._logining = function () {
	this.loginMask.visible = true;
};

Welcome.prototype._loginFail = function () {
	this.loginMask.visible = false;
};

Welcome.prototype.hide = function() {
	this.gameObject.visible = false;
};

Welcome.prototype.show = function() {
	this.gameObject.visible = true;
};
