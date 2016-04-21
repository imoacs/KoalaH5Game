var Koala = qc.Koala = {
	ui : {},
	logic : {},

	// 游戏对象
	game : null,

	// 游戏宽度
	GAMEWIDTH : 640,

	// 逻辑脚本准备就绪事件
	onLogicReady : new qc.Signal(),

	// 柱子创建完成
	onPillarReady : new qc.Signal(),

	// 游戏开始事件
	onStart : new qc.Signal(),

	// 考拉拿起秋千事件
	onSwingTake : new qc.Signal(),

	// 游戏结束事件
	onGameOver : new qc.Signal(),

	// 游戏分数发生变化事件
	onScoreChange : new qc.Signal(),

	// 游戏暂停事件
	onPause : new qc.Signal(),

	// 继续游戏事件
	onContinue : new qc.Signal(),

	// 调整相机事件
	onAdjustCamera : new qc.Signal(),

	// 相机做Tween动画事件
	onTweenCamera : new qc.Signal(),

	// 显示排行榜事件
	showRanking : new qc.Signal(),

	// 排行榜关闭事件
	onRankingClose : new qc.Signal(),

	// 登录成功事件
	onLogin : new qc.Signal(),

	// 登录中事件
	onLogining : new qc.Signal(),

	// 登录失败事件
	onLoginFail : new qc.Signal(),

	// 显示关注页面事件
	showFollowMsg : new qc.Signal(),

	// 显示分享提示页面事件
	showShareMsg : new qc.Signal()
};

Koala.initLogic = function(excel, game) {

	// 设置游戏对象引用
	this.game = game;

	// 设置游戏帧率为60帧
	game.time.frameRate = 60;

	// 初始化系统配置
	this.logic.config = new qc.Koala.logic.Config(excel);

	// 游戏相关数据逻辑类
	this.logic.me = new qc.Koala.logic.Me();

	// 柱子相关逻辑类
	this.logic.pillar = new qc.Koala.logic.Pillar(excel);

	// 风力值逻辑类
	this.logic.wind = new qc.Koala.logic.Wind(excel);

	// 分数相关逻辑类
	this.logic.score = new qc.Koala.logic.Score(excel);

	// 分享相关逻辑类
	this.logic.share = new qc.Koala.logic.Share(excel);

	// 百分比相关逻辑类
	this.logic.percent = new qc.Koala.logic.Percent(excel);

	// 派发脚本准备就绪事件
	this.onLogicReady.dispatch();
};

/**
 * 重置游戏逻辑类
 */
Koala.resetLogic = function() {
	this.logic.me.reset();
};

// 数学相关方法
Koala.Math = {};

/**
 * 判断两个数是否相等，忽略浮点数
 * @param  {number} a
 * @param  {number} b
 * @return {boolean}
 */
Koala.Math.equal = function(a, b) {
	var delta = Math.abs(b - a);
	return delta <= 1e-10;
};

/**
 * 获取min到max之间的随机整数，min和max值都取得到
 * @param  {number} min - 最小值
 * @param  {number} max - 最大值
 * @return {number}
 */
Koala.Math.random = function(min, max) {
	min = min == null ? 0 : min;
	max = max == null ? 1 : max;
	var delta = (max - min) + 1;
	return Math.floor(Math.random() * delta + min);
};
