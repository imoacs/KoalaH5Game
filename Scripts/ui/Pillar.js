// 柱子类
var Pillar = qc.defineBehaviour('qc.Koala.ui.Pillar', qc.Behaviour, function() {
	this.swing = null;

	// 分数区域
	this.scoreRect = Infinity;
}, {
	// 秋千预制
	swingPrefab : qc.Serializer.PREFAB,
	// 柱子背景
	bg : qc.Serializer.NODE,
	// 柱头
	head : qc.Serializer.NODE
});

/**
 * 初始化柱子
 * @param  {number} start - 上一个柱子的x轴坐标
 */
Pillar.prototype.init = function(prePillar, level) {

	// 获取柱子的宽度和上边距信息
	var info = qc.Koala.logic.pillar.getInfo(level);
	this.gameObject.width = info.thickness;

	// 初始化分数区域
	this.scoreRect = info.scoreRect;

	// 初始化柱子背景
	this.initBg(info.thickness);

	// 初始化柱帽
	this.initHead(info.headIcon);

	// 设置柱子的上边距和左边距
	this.gameObject.y = info.top - this.gameObject.parent.y;

	if (prePillar == null) {
		this.gameObject.x = 0;
	}
	else {
		this.gameObject.x = prePillar.gameObject.x + qc.Koala.GAMEWIDTH - this.gameObject.width;
		this.gameObject.y += prePillar.gameObject.y;
	}
	console.log('this.gameObject.y:',this.gameObject.y);
	// 创建秋千对象
	if (!this.swing)
		this.swing = this.createSwing();

	// 初始化秋千
	this.initSwing();
};

/**
 * 初始化柱子背景
 * @param  {number} width - 柱子宽度
 */
Pillar.prototype.initBg = function (width) {
	var nativeWidth = this.bg.nativeSize.width,
		ratio = width / nativeWidth,
		bottom = this.bg.parent.height * (1 - ratio),
		right = nativeWidth * (1 - ratio);
	this.bg.scaleX = this.bg.scaleY = ratio;
	this.bg.bottom = -bottom;
	this.bg.right = -right;
};

/**
 * 初始化柱帽图片资源
 * @param  {string} headIcon - 柱帽图片资源名称
 */
Pillar.prototype.initHead = function (headIcon) {
	this.head.frame = headIcon + '.png';
};

/**
 * 创建秋千对象
 * @return {qc.Koala.ui.Swing}
 */
Pillar.prototype.createSwing = function() {
	var node = this.game.add.clone(this.swingPrefab, this.gameObject.parent.parent);
	return node.getScript('qc.Koala.ui.Swing');
};

/**
 * 初始化秋千
 */
Pillar.prototype.initSwing = function() {
	this.swing.init(this);
};
