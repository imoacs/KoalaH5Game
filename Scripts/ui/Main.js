var Main = qc.defineBehaviour('qc.Koala.ui.Main', qc.Behaviour, function() {
    // 风值
    this.windValue = 0;

    // 掉落事件控制器
    this.dropTimer = null;

    // 跳台对象
    this._step = null;

    // 秋千对象
    this.swing = null;
}, {
    // 柱子池
    pillarPool : qc.Serializer.NODE,
    // 考拉节点
    koala : qc.Serializer.NODE,
    // 暂停按钮
    pauseBtn : qc.Serializer.NODE,
    // 风值
    wind : qc.Serializer.NODE,
    // 风向
    windDirection : qc.Serializer.NODE,
    // 分数节点
    score : qc.Serializer.NODE
});

/**
 * 初始化
 */
Main.prototype.awake = function() {
    var self = this;
    var camera = this.pillarPool.parent;

    // 监听柱子初始化完成事件
    this.addListener(qc.Koala.onPillarReady, this._onPillarReady, this);

    // 监听游戏开始事件
    this.addListener(qc.Koala.onStart, this.restart, this);

    // 监听分数改变事件
    this.addListener(qc.Koala.onScoreChange, this.updateScore, this);

    // 监听暂停按钮点击事件
    this.addListener(this.pauseBtn.onClick, this._pause, this);

    // 继续游戏时，恢复暂停按钮交互
    this.addListener(qc.Koala.onContinue, function() {
        this.pauseBtn.interactive = true;
    }, this);

    // 在游戏开始钱禁止交互
    this.gameObject.interactive = false;

    // 考拉拿起秋千时，启动交互
    this.addListener(qc.Koala.onSwingTake, function() {
        this.gameObject.interactive = true;
    }, this);

    //// 初始化游戏逻辑脚本
    //qc.Koala.initLogic(this.config, this.game);

    // 分数文本中间值，用于TweenProperty组件使用
    this.score._tempText = 0;
    Object.defineProperties(this.score, {
        'tempText' : {
            get : function() { return this._tempText; },
            set : function(v) {
                if (this._tempText === v) return;

                this._tempText = v;
                this.text = Math.floor(v) + '';
            }
        }
    });
};

/**
 * 柱子准备完毕后处理
 * @param  {array} pillarList - 柱子列表
 */
Main.prototype._onPillarReady = function(pillarList) {
    this.startStep = pillarList[0];
    this.swing = this.startStep.swing;

    var s = this.koala.getScript('qc.Koala.ui.Koala');
    s.init(this.startStep);
};

/**
 * 暂停游戏
 */
Main.prototype._pause = function () {
    // 如果游戏结束，则暂停按钮点击不做任何处理
    if (qc.Koala.logic.me.isDie)
        return;

    // 设置游戏暂停状态
    qc.Koala.logic.me.paused = true;

    // 派发游戏暂停事件
    qc.Koala.onPause.dispatch();
};

/**
 * 重新开始游戏
 */
Main.prototype.restart = function() {
    // 重置逻辑脚本
    qc.Koala.resetLogic();

    // 如果掉落还没结束，则强制移除掉落的循环控制器
    if (this.dropTimer) {
        this.game.timer.remove(this.dropTimer);
        this.dropTimer = null;
    }

    // 监听相机位置调整完成事件
    var camera = this.pillarPool.parent,
        s = camera.getScript('qc.TweenPosition');
    s.onFinished.addOnce(this.start, this);

    // 重置相机位置
    this.resetCamera();

    // 显示游戏界面
    this.show();
};

/**
 * 开始游戏
 * @param  {boolean} reset - 是否重置游戏
 */
Main.prototype.start = function (reset) {
    // 是否重新开始游戏
    if (reset === true) {
        this.restart();
        return;
    }

    // 启动暂停按钮交互
    this.pauseBtn.interactive = true;

    // 更新风值
    this.initWind();

    // 重置柱子列表
    var pool = this.pillarPool.getScript('qc.Koala.ui.PillarPool');
    pool.reset();

    // 考拉开始走
    var koalaScript = this.koala.getScript('qc.Koala.ui.Koala');
    koalaScript.walk();
};

/**
 * 更新分数文本
 * @param  {number} score - 当前分数
 */
Main.prototype.updateScore = function (score) {
    var s = this.score.getScript('qc.TweenProperty');
    s.setCurrToStartValue();
    s.to = score;
    qc.Tween.resetGroupToBeginning(this.score, 1);
    qc.Tween.playGroup(this.score, 1);
};

/**
 * 初始化风值
 */
Main.prototype.initWind = function() {
    var windObj = qc.Koala.logic.wind.getWind(qc.Koala.logic.me.level);
    this.windValue = windObj.value * windObj.direction;
    this.wind.text = windObj.value + '';

    this.wind.parent.visible = windObj.value !== 0;
    this.windDirection.rotation = Math.PI * (windObj.direction - 1) * 0.5;
};

/**
 * 监听点击事件
 */
Main.prototype.onClick = function() {
    // 禁止交互
    this.gameObject.interactive = false;

    // 关卡数加1
    qc.Koala.logic.me.level++;

    // 计算考拉下落高度
    var rotation = this.swing.gameObject.rotation,
        cos = Math.cos(rotation),
        sin = Math.sin(rotation),
        radius = this.swing.gameObject.height,
        h = radius * (cos - Math.cos(this.swing.maxRotation));

    // 计算横向及纵向速度
    var dir = this.swing.direction,
        v0 = Math.sqrt(2 * qc.Koala.logic.config.g * h) * dir,
        vx0 = v0 * cos + this.windValue,
        vy0 = v0 * sin;


    // 获取考拉脚本对象
    var koalaScript = this.koala.getScript('qc.Koala.ui.Koala');
    // 考拉放手
    koalaScript.away();

    // 获取跳台对象
    var pool = this.pillarPool.getScript('qc.Koala.ui.PillarPool');
    this._step = pool.getStep();

    // 考拉做抛物线运动
    this.drop(vx0, vy0);
};

/**
 * 考拉脱离缰绳开始掉落
 * @param  {number} vx0 - x方向初始速度
 * @param  {number} vy0 - y方向初始速度
 */
Main.prototype.drop = function(vx0, vy0) {
    // 循环定时器刷新考拉位置
    this.dropTimer = this.game.timer.loop(0, function() {
        if (qc.Koala.logic.me.paused)
            return;
        // 计算纵向速度
        var t = this.game.time.deltaTime * 0.001;
        vy0 = vy0 + qc.Koala.logic.config.g * t;

        // 考拉掉落处理
        this._onDrop(vx0, vy0, t);
    }, this);
};

/**
 * 考拉掉落帧处理
 * @param  {number} vx0 - 横向速度
 * @param  {number} vy0 - 纵向速度
 * @param  {number} t - 俩帧之间的时间间隔
 */
Main.prototype._onDrop = function (vx0, vy0, t) {
    // 计算横向和纵向偏移值
    var preY = this.koala.y,
        deltaX = vx0 * t,
        deltaY = vy0 * t;

    // 设置考拉位置
    this.koala.x += deltaX;
    this.koala.y += deltaY;

    // 调整相机位置
    this.adjustCamera(deltaX, deltaY);

    // 检测考拉位置
    var result = this._checkCollide(preY);
    if (result !== 0) {
        // 移除定时器
        this.game.timer.remove(this.dropTimer);
        this.dropTimer = null;

        // 成功跳到下一个站台
        if (result === 1) {
            this._onStep();
        }

        // 游戏结束
        if (result < 0) {
            this.gameOver(result);
        }
    }
};

/**
 * 考拉成功跳到下一个站台后处理
 */
Main.prototype._onStep = function() {
    var koalaScript = this.koala.getScript('qc.Koala.ui.Koala');
    koalaScript.fall(this._step);

    // 矫正柱子的位置
    this.adjustPillar();

    // 下一个跳台
    var pool = this.pillarPool.getScript('qc.Koala.ui.PillarPool');
    pool.next();

    // 重置秋千
    this.swing.reset();

    // 更新考拉当前所在跳台和当前正在使用的秋千
    this.startStep = this._step;
    this.swing = this._step.swing;

    // 重新获取风力值
    this.initWind();
};

/**
 * 检测考拉是否可以站在平台上
 * @param  {number} preY - 考拉移动前的y轴位置
 * @return {number} 返回值定义如下
 *          1：落在跳台上；
 *         -1：超出游戏边界；
 *         -2：碰到跳台的左边缘；
 *          0：还在掉落
 */
Main.prototype._checkCollide = function(preY) {
    var x = this.koala.x,
        y = this.koala.y,
        step = this._step.gameObject;

    // 判断是否落到跳台上
    if (x > step.x &&
        x < step.x + step.width &&
        preY <= step.y + step.parent.y &&
        y >= step.y + step.parent.y)
        return 1;

    // 超出游戏边界，因为相机有跟着考拉在动，所以在这边不需要判断游戏屏幕x轴方向超边
    if (y > this.gameObject.height + this.koala.height - this.pillarPool.parent.y)
        return -1;

    // 判断与跳台左边缘碰撞
    if (x > step.x &&
        x < step.x + step.width &&
        preY > step.y + step.parent.y)
        return -2;

    return 0;
};

/**
 * 调整考拉位置
 */
Main.prototype.adjustKoala = function() {
    var step = this._step.gameObject;
    if (this.koala.y > step.y &&
        this.koala.y < step.y + this.koala.height)
        this.koala.y = step.y;
};

/**
 * 跳到跳台上后，调整柱子位置
 */
Main.prototype.adjustPillar = function() {
    var camera = this.pillarPool.parent,
        s = camera.getScript('qc.TweenPosition'),
        step = this._step.gameObject,
        p = new qc.Point(-step.x - camera.parent.width * 0.5, -step.y);
    s.to = p.clone();
    s.setCurrToStartValue();
    s.resetToBeginning();
    s.play();

    p.subtract(s.from.x, s.from.y);
    qc.Koala.onTweenCamera.dispatch(p);
};

/**
 * 调整相机位置
 * @param  {number} deltaX - x轴偏移值
 * @param  {number} deltaY - y轴偏移值
 */
Main.prototype.adjustCamera = function(deltaX, deltaY) {
    var camera = this.pillarPool.parent,
        step = this._step.gameObject;
    camera.x -= deltaX;
    if (camera.y - deltaY < -step.y)
        camera.y = -step.y;
    else
        camera.y -= deltaY;

    // 派发调整相机位置事件
    qc.Koala.onAdjustCamera.dispatch(new qc.Point(deltaX, deltaY));
};

/**
 * 重置相机位置
 */
Main.prototype.resetCamera = function () {
    var camera = this.pillarPool.parent,
        s = camera.getScript('qc.TweenPosition');
    s.to = new qc.Point(-camera.parent.width * 0.5, 0);
    s.setCurrToStartValue();
    s.resetToBeginning();
    s.play();
};

/**
 * 游戏结束，并播放掉落动画
 * @param  {number} result - 游戏死亡类型
 *         -1：超出游戏边界；
 *         -2：碰到跳台的左边缘；
 */
Main.prototype.gameOver = function(result) {
    // 设置游戏死亡状态
    qc.Koala.logic.me.isDie = true;

    // 禁止暂停按钮交互
    this.pauseBtn.interactive = false;

    // 超出游戏边界
    if (result === -1) {
        qc.Koala.onGameOver.dispatch();
        return;
    }

    // 碰到跳台的左边缘
    if (result === -2) {
        // 播放死亡动作
        var koalaScript = this.koala.getScript('qc.Koala.ui.Koala');
        koalaScript.die(function() {
            qc.Koala.onGameOver.dispatch();
        });
    }
};

/**
 * 显示界面
 */
Main.prototype.show = function () {
    this.gameObject.visible = true;
};

/**
 * 隐藏界面
 */
Main.prototype.hide = function () {
    this.gameObject.visible = false;
};
