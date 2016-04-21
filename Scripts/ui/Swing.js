var Swing = qc.defineBehaviour('qc.Koala.ui.Swing', qc.Behaviour, function() {
	// 秋千最大摆角
	this._maxRotation = 0;

	// 方向
	this.direction = 1;

	this.deltaRotation = Math.PI / 180 * 5;

	this.beginRotation = 0;
}, {
});

Object.defineProperties(Swing.prototype, {
	/**
	 * 秋千最大摆角
	 * @type {number}
	 */
	maxRotation : {
		get : function() { return this._maxRotation; },
		set : function(v) {
			if (this._maxRotation === v) return;

			this._maxRotation = v;

			var s = this.gameObject.getScript('qc.TweenRotation');
			s.from = v;
			s.to = -v;
		}
	}
});

/**
 * 初始化
 */
Swing.prototype.awake = function() {
	var s = this.gameObject.getScript('qc.TweenRotation');
	this.addListener(s.onLoopFinished, this._onSwingFinished, this);
};

/**
 * 钟摆循环结束后，更新方向值
 */
Swing.prototype._onSwingFinished = function() {
	this.direction *= -1;
};

/**
 * 初始化秋千
 * @param  {qc.Koala.ui.Pillar} pillar - 柱子对象
 */
Swing.prototype.init = function(pillar) {
	this.gameObject.anchoredX = pillar.gameObject.x;
	this.gameObject.y = pillar.gameObject.y;
	console.log('pillar.gameObject.x:',pillar.gameObject.x);
	console.log('pillar.gameObject.y:',pillar.gameObject.y);
	// 计算三角形的宽高
	var height = pillar.gameObject.parent.y;
	var width = qc.Koala.GAMEWIDTH * 0.5 - pillar.gameObject.width;

	// 计算秋千最大摆角
	this.beginRotation = Math.atan(width / height);

	this.maxRotation = this.beginRotation + this.deltaRotation;

	this.gameObject.height = Math.sqrt(width * width + height * height);

	// 重置秋千位置
	this.reset();
};

/**
 * 播放钟摆动画
 * @param  {boolean} con - 是否从上一次暂停的地方开始播放
 */
Swing.prototype.play = function(con) {
	if (!con)
		qc.Tween.resetGroupToBeginning(this.gameObject, 2);
	qc.Tween.playGroup(this.gameObject, 2);
};

/**
 * 停止钟摆动画
 */
Swing.prototype.stop = function () {
	qc.Tween.stopGroup(this.gameObject, 2);
};

/**
 * 回到起点
 */
Swing.prototype.reset = function() {
	qc.Tween.stopGroup(this.gameObject, 2);
	qc.Tween.resetGroupToBeginning(this.gameObject, 2);
	this.gameObject.rotation = this.beginRotation;

	this.direction = 1;
};
