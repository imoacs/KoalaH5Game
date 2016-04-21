// 柱子池
var PillarPool = qc.defineBehaviour('qc.Koala.ui.PillarPool', qc.Behaviour, function() {
	this.pillarList = [];
}, {
	// 柱子预制
	pillarPrefab : qc.Serializer.PREFAB
});

PillarPool.prototype.awake = function() {
	this.addListener(qc.Koala.onLogicReady, this._init, this);
};

/**
 * 初始化柱子
 */
PillarPool.prototype._init = function() {
	// 设置柱子池高度
	this.gameObject.top = qc.Koala.logic.config.pillarTopMin;

	var prePillar = null;
	for (var i = 0; i < 3; i++) {
		var pillar = this.pillarList[i] || this.createPillar();
		if (prePillar) {
			pillar.init(prePillar, i);
		}
		else {
			pillar.init(null, i);
		}
		prePillar = pillar;
		this.pillarList[i] = pillar;
	}

	qc.Koala.onPillarReady.dispatch(this.pillarList);
};

/**
 * 创建柱子
 */
PillarPool.prototype.createPillar = function() {
	var node = this.game.add.clone(this.pillarPrefab, this.gameObject);
	return node.getScript('qc.Koala.ui.Pillar');
};

/**
 * 下一关
 */
PillarPool.prototype.next = function() {
	var p = this.pillarList.shift();
	this.pillarList.push(p);

	var step = this.getStep();
	p.init(step, qc.Koala.logic.me.level + 1);
};

/**
 * 重置柱子列表
 */
PillarPool.prototype.reset = function () {
	this._init();
};

/**
 * 获取跳台
 * @return {qc.Node}
 */
PillarPool.prototype.getStep = function() {
	return this.pillarList[1];
};
