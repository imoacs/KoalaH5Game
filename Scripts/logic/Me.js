var Me = qc.Koala.logic.Me = function() {
	// 当前关卡
	this.level = 1;

	// 当前分数
	this._score = 0;

	// 历史最高分
	this._best = 0;

	// 游戏是否结束
	this.isDie = false;

	// 游戏是否暂停
	this.paused = false;

	// 用户相关信息
	this.token = '';
	this.rid = '';
	this.userInfo = null;
	this.channel = '';
};

Me.prototype = {};
Me.prototype.constructor = Me;

Object.defineProperties(Me.prototype, {
	'score' : {
		get : function() { return this._score; },
		set : function(v) {
			if (this._score === v) return;
			this._score = v;

			this.best = v;

			qc.Koala.onScoreChange.dispatch(v);
		}
	},

	'best' : {
		get : function() { return this._best; },
		set : function(v) {
			if (this._best >= v) return;
			this._best = v;

			var key = 'best_' + this.rid;
			qc.Koala.game.storage.set(key, v);
		}
	}
});

Me.prototype.reset = function() {
	this.level = 1;
	this.score = 0;

	this.isDie = false;
	this.paused = false;
};

/**
 * 加分
 * @param  {number} score - 增量
 */
Me.prototype.addScore = function(score) {
	if (typeof score !== 'number' || score <= 0) return;

	this.score = this._score + score;
};

/**
 * 校正最高分
 */
Me.prototype.adjustBest = function () {
	if (!this.userInfo) return;

	var score = this.userInfo.scorers;
	this.readFromStorage();
	if (score > this._best)
		this.best = score;
};

/**
 * 读取记录
 */
Me.prototype.readFromStorage = function () {
	var key = 'best_' + this.rid;
	var best = qc.Koala.game.storage.get(key);
	if (best) this.best = best;
};

/**
 * 保存记录
 */
Me.prototype.saveToStorage = function () {
	qc.Koala.game.storage.save();
};
