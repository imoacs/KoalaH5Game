var Background = qc.defineBehaviour('qc.Koala.ui.Background', qc.Behaviour, function() {
    // 动画播放距离
    this.tweenDistance = 0;

    // 山与山之间的距离
    this.mountainDistance = 635;

    // 树与树之间的距离
    this.treeDistance = 340;

    this.mountains = [];

    this.trees = [];

    this.treeIcons = [ 'tree_1.bin', 'tree_2.bin', 'tree_3.bin' ];
}, {
    // 云列表
    clouds : qc.Serializer.NODES,
    // 山峰区域
    mountainRect : qc.Serializer.NODE,
    // 山峰预制
    mountainPrefab : qc.Serializer.PREFAB,
    // 树区域
    treeRect : qc.Serializer.NODE,
    // 树预制
    treePrefab : qc.Serializer.PREFAB
});

Background.prototype.awake = function() {
    // 监听调整相机事件
    this.addListener(qc.Koala.onAdjustCamera, this._adjust, this);

    // 监听动画调整相机事件
    this.addListener(qc.Koala.onTweenCamera, this._tween, this);

    this.addListener(this.game.world.onSizeChange, function() {
        this.initMountain();
        this.initTree();
    }, this);

    this.game.timer.add(1000, this.init, this);
};

Background.prototype.init = function () {
    this.clouds.forEach(function(cloud) {
        var s = cloud.getScript('qc.TweenPosition');
        s.from.setTo(cloud.parent.width, s.from.y);
        s.resetToBeginning();
        s.play();
        cloud.visible = true;
    }, this);

    // 初始化山
    this.initMountain();

    // 初始化树
    this.initTree();
};

/**
 * 初始化山
 * @method qc.Koala.ui.Background#initMountain
 */
Background.prototype.initMountain = function () {
    var mountainCount = Math.ceil(this.gameObject.width / this.mountainDistance) + 1,
        count = mountainCount - this.mountains.length;
    if (count <= 0) return;
    this._createMountain(count);
};

/**
 * 创建山
 * @method createMountain
 * @param  {number} count - 要创建的个数
 */
Background.prototype._createMountain = function (count) {
    while (count--) {
        var m = this.game.add.clone(this.mountainPrefab, this.mountainRect);
        m.x = this.mountainDistance * this.mountains.length;
        this.mountains.push(m);
    }
};

/**
 * 初始化树
 * @method qc.Koala.ui.Background#initTree
 */
Background.prototype.initTree = function () {
    var treeCount = Math.ceil(this.gameObject.width / this.treeDistance) + 1,
        count = treeCount - this.trees.length;
    if (count <= 0) return;
    this._createTree(count);
};

/**
 * 创建树
 * @method qc.Koala.ui.Background#createTree
 * @param  {number}   count - 创建个数
 */
Background.prototype._createTree = function (count) {
    while (count--) {
        var t = this.game.add.clone(this.treePrefab, this.treeRect);
        t.x = this.treeDistance * this.trees.length;
        this.trees.push(t);

        var icon = this.treeIcons[qc.Koala.Math.random(0, this.treeIcons.length - 1)];
        this.game.assets.load(
            'treeIcon_' + this.trees.length,
            'Assets/texture/' + icon,
            (function(texture) {
                this.texture = texture;
            }).bind(t)
        );
        t.height += qc.Koala.Math.random(-10, 40);
    }
};

/**
 * 调整山和树的位置
 * @param  {qc.Point} delta - 调整的距离
 */
Background.prototype._adjust = function(delta) {
    var x = delta.x, y = delta.y,
        width = this.gameObject.width;

    // 更新山的位置
    var mX = x * qc.Koala.logic.config.mountainCoef,
        mY = y * qc.Koala.logic.config.mountainCoef,
        mLen = this.mountains.length;
    this.mountains.forEach(function(m, index) {
        m.x -= mX;
        if (m.x <= -this.mountainDistance)
            m.x += this.mountainDistance * mLen;
    }, this);

    // 更新树的位置
    var tX = x * qc.Koala.logic.config.treeCoef,
        tY = y * qc.Koala.logic.config.treeCoef,
        treeLen = this.trees.length;
    this.trees.forEach(function(t, index) {
        t.x -= tX;
        if (t.x <= -this.treeDistance)
            t.x += this.treeDistance * treeLen;
    }, this);
};

/**
 * 使用Tween动画调整山和树的位置
 * @param  {qc.Point} delta - 调整的距离
 */
Background.prototype._tween = function(delta) {
    this.tweenDistance = delta.x;

    // 记录山当前横轴坐标
    this.mountains.forEach(function(m) {
        m._beginX_ = m.x;
    }, this);

    // 记录树当前横轴坐标
    this.trees.forEach(function(t) {
        t._beginX_ = t.x;
    }, this);

    var s = this.gameObject.getScript('qc.TweenFunction');
    s.resetToBeginning();
    s.play();
};

/**
 * 通过TweenFunction改变山和树的位置
 * @param  {number} factor - 事件轴对应的曲线值
 */
Background.prototype.tweenBg = function (factor) {
    var x = this.tweenDistance * factor;

    // 更新山的位置
    var mX = x * qc.Koala.logic.config.mountainCoef,
        mLen = this.mountains.length;
    this.mountains.forEach(function(m, index) {
        m.x = m._beginX_ + mX;
        if (m.x <= -this.mountainDistance)
            m.x += this.mountainDistance * mLen;
    }, this);

    // 更新树的位置
    var tX = x * qc.Koala.logic.config.treeCoef,
        treeLen = this.trees.length;
    this.trees.forEach(function(t, index) {
        t.x = t._beginX_ + tX;
        if (t.x <= -this.treeDistance)
            t.x += this.treeDistance * treeLen;
    }, this);
};
