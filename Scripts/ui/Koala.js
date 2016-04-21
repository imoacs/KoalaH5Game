var Koala = qc.defineBehaviour('qc.Koala.ui.Koala', qc.Behaviour, function() {
	// 秋千对象
	this.swingScript = null;

	// 考拉当前播放的动作
	this.currAnimation = 'stand';
}, {
	// 相机节点
	camera : qc.Serializer.NODE,
	// 特效节点
	effect : qc.Serializer.NODE,
	// 文本
	labelImg : qc.Serializer.NODE,
	// 分数
	scoreImg : qc.Serializer.NODE,
	// 死亡效果图片
	dieImg : qc.Serializer.NODE,
	// 刹车效果图片
	brakeImg : qc.Serializer.NODE
});

/**
 * 初始化
 */
Koala.prototype.awake = function () {
	// 监听游戏暂停事件
	this.addListener(qc.Koala.onPause, this._pause, this);

	// 监听游戏继续事件
	this.addListener(qc.Koala.onContinue, this._continue, this);
};

/**
 * 暂停游戏
 */
Koala.prototype._pause = function () {
	this.swingScript.stop();
	this.gameObject.stop();

	this.labelImg.getScript('qc.TweenAlpha').onFinished.removeAll(this);

	// 并移除动作结束监听
	var s = this.gameObject.getScript('qc.TweenPosition');
	s.onFinished.remove(this.take, this);

	// 停止考拉走路位移动画
	qc.Tween.stopGroup(this.gameObject, 3);
};

/**
 * 继续游戏
 * @method qc.Koala.ui.Koala#_continue
 */
Koala.prototype._continue = function () {
	if (this.currAnimation !== 'die')
		this[this.currAnimation]();
};

/**
 * 初始化考拉位置
 * @param  {qc.Koala.ui.Pillar} pillar - 柱子对象
 */
Koala.prototype.init = function(pillar) {
	// 停止考拉动作播放
	qc.Tween.stopGroup(this.gameObject, 1);

	// 设置秋千对象引用
	this.swingScript = pillar.swing;

	// 设置考拉位置
	this.gameObject.parent = pillar.gameObject;
	this.gameObject.anchoredX = -(pillar.gameObject.width + this.gameObject.width) * 0.5;
	this.gameObject.anchoredY = -pillar.gameObject.height;
	this.gameObject.rotation = 0;

	// 更新考拉走动的动画状态
	this.updateTween(pillar);

	// 站立
	this.stand();
};

/**
 * 站立
 */
Koala.prototype.stand = function() {
	this.currAnimation = 'stand';
	this.gameObject.playAnimation('stand');
};

/**
 * 走
 */
Koala.prototype.walk = function() {
	// 隐藏刹车效果
	this.brakeImg.visible = false;

	this.labelImg.getScript('qc.TweenAlpha').onFinished.removeAll(this);

	this.currAnimation = 'walk';
	this.gameObject.playAnimation('walk');

	var s = this.gameObject.getScript('qc.TweenPosition');
	s.onFinished.addOnce(this.take, this);
	s.resetToBeginning();
	s.play();
};

/**
 * 拿秋千
 */
Koala.prototype.take = function() {
	// 拿秋千动作结束后处理
	this.gameObject.onFinished.addOnce(function() {
		// 设置考拉在秋千上的位置
		this.gameObject.parent = this.swingScript.gameObject;
		this.gameObject.anchoredX = 0;
		this.gameObject.anchoredY = 0;
		this.gameObject.rotation = 0;

		// 设置考拉状态
		this.swing();

		// 派发拿起秋千事件
		qc.Koala.onSwingTake.dispatch();
	}, this);

	this.currAnimation = 'take';
	// 播放拿秋千动作
	this.gameObject.playAnimation('take');
};

/**
 * 荡秋千
 */
Koala.prototype.swing = function() {
	if (qc.Koala.logic.me.paused) return;
	this.swingScript.play(true);
	this.currAnimation = 'swing';
	this.gameObject.playAnimation('swing');
};

/**
 * 放开秋千
 */
Koala.prototype.away = function() {
	this.gameObject.switchParent(this.camera);
	this.gameObject.rotation = 0;

	this.currAnimation = 'away';
	this.gameObject.playAnimation('away');
};

/**
 * 掉落在跳台上
 * @param  {qc.Koala.ui.Pillar} pillar - 柱子对象
 */
Koala.prototype.fall = function(pillar) {
	// 设置下一个秋千对象引用
	this.swingScript = pillar.swing;

	// 矫正考拉在柱子上的位置，防止叫陷到柱子里面去
	this.gameObject.y = pillar.gameObject.y + pillar.gameObject.parent.y;

	// 将考拉挂载在柱子上
	this.gameObject.switchParent(pillar.gameObject);

	// 显示刹车效果
	this.brakeImg.parent = this.gameObject.parent;
	this.brakeImg.x = this.gameObject.x;
	this.brakeImg.y = this.gameObject.y;
	this.brakeImg.visible = true;

	this.currAnimation = 'fall';
	// 播放动作
	this.gameObject.playAnimation('fall');

	// 更新考拉走路曲线参数
	this.updateTween(pillar);

	// 加分数
	var distance = Math.abs(this.gameObject.anchoredX);

		scoreInfo = qc.Koala.logic.score.getScore(distance, pillar.scoreRect);
	qc.Koala.logic.me.addScore(scoreInfo.value);

	this.playEffect(scoreInfo.effectName);

	this.playLabel(scoreInfo);

	qc.Tween.resetGroupToBeginning(this.labelImg, 1);
	qc.Tween.playGroup(this.labelImg, 1);

	this.currAnimation = 'walk';
};

/**
 * 播放文字效果
 * @param  {object} info - 分数对象
 */
Koala.prototype.playLabel = function (info) {
	this.scoreImg.frame = info.scoreImg;
	this.scoreImg.resetNativeSize();
	this.labelImg.frame = info.labelImg;
	this.labelImg.resetNativeSize();

	this.labelImg.getScript('qc.TweenAlpha').onFinished.addOnce(this.walk, this);
};

/**
 * 播放特效
 * @param  {string} effectName - 动画名称
 */
Koala.prototype.playEffect = function (effectName) {
	if (!effectName) return;

	this.effect.parent = this.gameObject.parent;
	this.effect.x = this.gameObject.x;
	this.effect.y = this.gameObject.y;

	this.effect.playAnimation(effectName);
};

/**
 * 死亡
 * @param  {Function} callback - 回调函数
 * @param  {object}   context  - 回调函数上下文
 */
Koala.prototype.die = function(callback, context) {
	// 设置动画的起始值及结束值
	var scripts = this.gameObject.getScripts('qc.TweenProperty');
	scripts.forEach(function(s) {
		s.setCurrToStartValue();
		if (s.property === 'anchoredY') {
			s.from = this.gameObject.anchoredY;
			s.to = this.gameObject.height - this.gameObject.parent.y;
		}
		else if (s.property === 'anchoredX') {
			s.from = this.gameObject.anchoredX;
			s.to = s.from - 100;
		}
	}, this);

	// 显示死亡效果
	this.dieImg.parent = this.gameObject.parent;
	this.gameObject.parent.setChildIndex(this.dieImg, this.gameObject.parent.children.length - 1);
	this.dieImg.x = this.gameObject.x;
	this.dieImg.y = this.gameObject.y;
	var s = this.dieImg.getScript('qc.TweenAlpha');
	s.onFinished.addOnce(function() {
		this.dieImg.visible = false;
	}, this);
	s.resetToBeginning();
	s.play();
	this.dieImg.visible = true;

	// 处理回调
	if (callback)
		scripts[0].onFinished.addOnce(callback, context);

	// 播放掉落动画
	qc.Tween.resetGroupToBeginning(this.gameObject, 1);
	qc.Tween.playGroup(this.gameObject, 1);

	this.currAnimation = 'die';
	this.gameObject.playAnimation('die');
};

/**
 * 重置考拉状态
 * @param {qc.Koala.ui.Pillar} pillar - 柱子对象
 */
Koala.prototype.reset = function (pillar) {
	this.init(pillar);
};

/**
 * 更新走动的动画起始及结束值
 * @param  {qc.Koala.ui.Pillar} pillar - 柱子对象
 */
Koala.prototype.updateTween = function(pillar) {
	var s = this.gameObject.getScript('qc.TweenPosition');
	s.setCurrToStartValue();
	s.to = new qc.Point(pillar.gameObject.width - 20, 0);
	if (s.from.x >= s.to.x) {
		s.to = s.from;
		s.duration = 0;
	}
	else {
		var deltaX = s.to.x - s.from.x;
		// 以每秒200的速度前进
		s.duration = deltaX * 0.005;
	}
};
