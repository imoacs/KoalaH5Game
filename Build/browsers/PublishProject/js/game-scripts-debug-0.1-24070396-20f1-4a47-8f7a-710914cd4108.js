/**
 * 用户自定义脚本.
 */
(function(window, Object, undefined) {

// 检测环境
var _ensureModule = function(clazz) {
    var arr = clazz.split('.');
    var curr = window;
    for (var i = 0; i < arr.length; i++) {
        if (!curr[arr[i]]) curr[arr[i]] = {};
        curr = curr[arr[i]];
    }
};


_ensureModule('com.qici.extraUI');
/**
 * @author chenqx
 * copyright 2015 Qcplay All Rights Reserved.
 */
/**
 * 滚动支持
 */
var ScrollView = qc.ScrollView;

var ScrollSupport = com.qici.extraUI.ScrollSupport = function(game, node, fnViewRect, fnContentRect, fnSetContentPos) {

    this.game = game;

	/**
	 * @property {qc.Node} node - 需要响应的节点
	 */
	this.node = node;

	/**
	 * @property {function} getViewRect - 得到视窗的大小
	 */
	this._getViewRect = fnViewRect;

	/**
	 * @property {function} getContentRect - 得到内容的大小
	 */
	this._getContentRect = fnContentRect;

	/**
	 * @property {function} setContentPosition - 设置内容的偏移
	 */
	this._setContentPosition = fnSetContentPos;

	/**
     * @property {boolean} canHorizontal - 是否响应水平滑动
     */
    this.canHorizontal = true;

    /**
     * @property {boolean} canVertical - 是否响应竖直滑动
     */
    this.canVertical = true;

    /**
     * @property {number} movementType - 边界限制类型
     */
    this.movementType = ScrollView.MOVEMENT_ELASTIC;

    /**
     * @property {number} elasticity - 当movementType === ScrollView.MOVEMENT_ELASTIC时生效，表示复位速度
     */
    this.elasticity = 1;

    /**
     * @property {boolean} inertia - 是否惯性滑动
     */
    this.inertia = true;

    /**
     * @property {number} decelerationRate - 惯性滑动的减速参数
     */
    this.decelerationRate = 0.03;

    /**
     * @property {number} scrollSensitivity - 响应滚动时的倍率
     */
    this.scrollSensitivity = 1;

    /**
     * @property {boolean} propagationScroll - 是否向上传递滚动事件
     * @type {boolean}
     */
    this.propagationScroll = false;

    /**
     * @property {Phaser.Signal} onValueChange - 偏移值发生变化时调用
     */
    this.onValueChange = new Phaser.Signal();

    /**
     * @property {qc.Point | null} _preContentPosition - 上一次处理的显示内容的偏移值
     * @private
     */
    this._preContentPosition = null;

    /**
     * @property {qc.Rectangle | null} _preContentRect - 上一次处理的内容区域在本节点坐标系下的位置
     * @private
     */
    this._preContentRect = null;

    /**
     * @property {qc.Rectangle | null} _preViewRect - 上一次处理的本视窗的大小
     * @private
     */
    this._preViewRect = null;

    /**
     * @property {qc.Point] _velocity - 滚动的速率，每秒移动的距离
     * @private
     */
    this._velocity = new qc.Point(0, 0);

    /**
     * @property {boolean} _isDragging - 是否正在拖拽中
     * @private
     */
    this._isDragging = false;

    this.pivotX = 0;
    this.pivotY = 0;

    // 监听滚动事件和拖拽事件
    if (this.node) {
	    this.node.onWheel.add(this._doWheel, this);
	    this.node.onDragStart.add(this._doDragStart, this);
	    this.node.onDrag.add(this._doDrag, this);
	    this.node.onDragEnd.add(this._doDragEnd, this);	
    }
};

ScrollSupport.prototype = {};
ScrollSupport.prototype.constructor = ScrollSupport;


Object.defineProperties(ScrollSupport.prototype,{
	/**
     * @property {qc.Node | null} horizontalScrollBar - 水平滚动条
     */
    horizontalScrollBar : {
        get : function() {
            if (this._horizontalScrollBar && this._horizontalScrollBar._destroy) {
                this._horizontalScrollBar = null;
            }
            return this._horizontalScrollBar;
        },
        set : function(value) {
            if (this._horizontalScrollBar) {
                this._horizontalScrollBar.onValueChange.remove(this._setHorizontalNormalizedPosition, this);
            }
            this._horizontalScrollBar = value;
            if (this._horizontalScrollBar) {
                this._horizontalScrollBar.onValueChange.add(this._setHorizontalNormalizedPosition, this);
            }
        }
    },

    /**
     * @property {qc.Node | null} verticalScrollBar - 竖直滚动条
     */
    verticalScrollBar : {
        get : function() {
            if (this._verticalScrollBar && this._verticalScrollBar._destroy) {
                this._verticalScrollBar = null;
            }
            return this._verticalScrollBar;
        },
        set : function(value) {
            if (this._verticalScrollBar) {
                this._verticalScrollBar.onValueChange.remove(this._setVerticalNormalizedPosition, this);
            }
            this._verticalScrollBar = value;
            if (this._verticalScrollBar) {
                this._verticalScrollBar.onValueChange.add(this._setVerticalNormalizedPosition, this);
            }
        }
    },

    /**
     * @property {number} horizontalNormalizedPosition - 水平方向上滚动的比例
     */
    horizontalNormalizedPosition : {
        get : function() {
            this._updateBounds();
            if (this._contentRect.width <= this._viewRect.width) {
                return (this._viewRect.x > this._contentRect.x) ? 1 : 0;
            }
            return (this._viewRect.x - this._contentRect.x) / (this._contentRect.width - this._viewRect.width);
        },
        set : function(value) {
            this.setNormalizedPosition(value, 0);
        }
    },

    /**
     * @property {number} verticalNormalizedPosition - 竖直方向上滚动的比例
     */
    verticalNormalizedPosition : {
        get : function() {
            this._updateBounds();
            if (this._contentRect.height <= this._viewRect.height) {
                return (this._viewRect.y > this._contentRect.y) ? 1 : 0;
            }
            return (this._viewRect.y - this._contentRect.y) / (this._contentRect.height - this._viewRect.height);
        },
        set : function(value) {
            this.setNormalizedPosition(value, 1);
        }
    }
});

/**
 * 析构
 */
ScrollSupport.prototype.destroy = function() {
	if (this.node) {
		this.node.onWheel.remove(this._doWheel, this);
	    this.node.onDragStart.remove(this._doDragStart, this);
	    this.node.onDrag.remove(this._doDrag, this);
	    this.node.onDragEnd.remove(this._doDragEnd, this);		
	}
    this.node = null;
    this._setContentPosition = null;
    this._getContentRect = null;
    this._getViewRect = null;
    this.horizontalScrollBar = null;
    this.verticalScrollBar = null;
};

/**
 * 更新
 */
ScrollSupport.prototype.update = function(deltaTime) {
    this._updateVelocity(deltaTime);
};

/**
 * 获取视窗大小
 */
ScrollSupport.prototype.getViewRect = function() {
	return this._getViewRect ? this._getViewRect() : new qc.Rectangle(0, 0, 0, 0);
};

/**
 * 获取内容大小
 */
ScrollSupport.prototype.getContentRect = function() {
	return this._getContentRect ? this._getContentRect() : new qc.Rectangle(0, 0, 0, 0);
};

/**
 * 设置内容显示的位置
 * @param x {Number} - x轴坐标
 * @param y {Number} - y轴坐标
 */
ScrollSupport.prototype.setContentPosition = function(x, y) {
	this._setContentPosition && this._setContentPosition(x, y);
};

/**
 * 设置水平位置
 * @param value {Number}
 * @private
 */
ScrollSupport.prototype._setHorizontalNormalizedPosition = function(value) {
    this.setNormalizedPosition(value, 0);
};

/**
 * 设置竖直位置
 * @param value {Number}
 * @private
 */
ScrollSupport.prototype._setVerticalNormalizedPosition = function(value) {
    this.setNormalizedPosition(value, 1);
};

/**
 * 计算移动指定距离后，显示区域对于视窗的越界偏移
 * @param deltaX {Number} - x轴上移动的距离
 * @param deltaY {Number} - y轴上移动的距离
 * @returns {qc.Point}
 */
ScrollSupport.prototype._calculateOffset = function(deltaX, deltaY) {
    var offset = new qc.Point(0, 0);
    // 无限制的情况下，没有越界处理
    if (this.movementType === ScrollView.MOVEMENT_UNRESTRICTED) {
        return offset;
    }
    var rect = this.getViewRect();
    var contentRect = this._contentRect;
    var min = new qc.Point(contentRect.x, contentRect.y);
    var max = new qc.Point(contentRect.x + contentRect.width, contentRect.y + contentRect.height);
    if (this.canHorizontal) {
        min.x += deltaX;
        max.x += deltaX;
        if (min.x > rect.x) {
            offset.x = rect.x - min.x;
        }
        else if (max.x < rect.x + rect.width) {
            offset.x = rect.x + rect.width - max.x;
        }
    }

    if (this.canVertical) {
        min.y += deltaY;
        max.y += deltaY;
        if (min.y > rect.y) {
            offset.y = rect.y - min.y;
        }
        else if (max.y < rect.y + rect.height) {
            offset.y = rect.y + rect.height - max.y;
        }
    }

    return offset;
};

/**
 * 处理回弹效果
 * @param position {qc.Point} - 当前位置
 * @param offset {qc.Point} - 需要处理的越界值
 * @param deltaTime {Number} - 上一帧到现在的时间
 * @param axisPos {'x' | 'y') - 滚动轴
 * @private
 */
ScrollSupport.prototype._calcVelocityEffect = function(position, offset, deltaTime, axisPos) {
    // 弹性处理
    if (this.movementType === ScrollView.MOVEMENT_ELASTIC && offset[axisPos] !== 0) {
        var lastOffset = this['_lastOffset_' + axisPos] || 0;
        if (Math.abs(lastOffset) < Math.abs(offset[axisPos])) {
            this['_lastOffset_' + axisPos] = offset[axisPos];
            this._currSmoothetTime = deltaTime;
        }
        else {
            this['_lastOffset_' + axisPos] = offset[axisPos];
            this._currSmoothetTime += deltaTime;
        }
        var smootherTime = this.elasticity <= 0 ? deltaTime : this.elasticity;
        var ret = this.game.math.smoothDamp(position[axisPos], position[axisPos] + offset[axisPos], this._velocity[axisPos], this.elasticity, Number.MAX_VALUE, deltaTime / 100);
        if (Math.abs(position[axisPos] + offset[axisPos] - ret[0]) < 0.0001) {
            position[axisPos] = position[axisPos] + offset[axisPos];
            this._velocity[axisPos] = 0;
        }
        else {
            position[axisPos] = ret[0];
            this._velocity[axisPos] = ret[1];
        }
        //position[axisPos] = position[axisPos] + offset[axisPos] * Phaser.Math.smoothstep(this._currSmoothetTime, 0, smootherTime * 1000);
        //this._velocity[axisPos] = 0;

    }
    else if (this.movementType === ScrollView.MOVEMENT_CLAMPED && offset[axisPos] !== 0) {
        position[axisPos] = position[axisPos] + offset[axisPos];
    }
    else if (this.inertia) {
        // 计算速度衰减
        var velocity = this._velocity[axisPos] * Math.pow(Math.abs(this.decelerationRate), deltaTime / 1000);
        if (Math.abs(velocity) < 1) {
            velocity = 0;
        }
        this._velocity[axisPos] = velocity;
        position[axisPos] = position[axisPos] + velocity * deltaTime / 1000;
    }
    else {
        this._velocity[axisPos] = 0;
    }
};

/**
 * 弹性形变
 * @param overStretching {Number} - 越界值，相当于力的大小
 * @param viewSize {Number} - 正常值
 * @return {Number} 产生的形变值
 * @private
 */
ScrollSupport.prototype._rubberDelta = function(overStretching, viewSize) {
    return (1 - (1 / ((Math.abs(overStretching) * 0.55 / viewSize) + 1))) * viewSize * this.game.math.sign(overStretching);
};

/**
 * 更新处理速度信息
 * @private
 */
ScrollSupport.prototype._updateVelocity = function(deltaTime) {
    var contentRect, position; 

    this._updateBounds();

    var offset = this._calculateOffset(0, 0);

    // 拖拽中，或者越界的偏移为0，或者回弹的速度为0时跳过
    if (!this._isDragging &&
        ((offset.x !== 0 || offset.y !== 0) ||
        (this._velocity.x !== 0 || this._velocity.y !== 0))) {

        contentRect = this.getContentRect();
        position = new qc.Point(contentRect.x, contentRect.y);

        this._calcVelocityEffect(position, offset, deltaTime, 'x');
        this._calcVelocityEffect(position, offset, deltaTime, 'y');

        if (this._velocity.x !== 0 ||
            this._velocity.y !== 0) {
            if (this.movementType === ScrollView.MOVEMENT_CLAMPED) {
                offset = this._calculateOffset(position.x - contentRect.x, position.y - contentRect.y);
                position.x += offset.x;
                position.y += offset.y;
            }
        }
        this.setContentPosition(position.x, position.y);
    }

    if (this._isDragging && this.inertia) {
        contentRect = this.getContentRect();
        var vx = contentRect.x - this._preContentPosition.x;
        var vy = contentRect.y - this._preContentPosition.y;

        var l =  this.game.math.clamp(deltaTime / 1000, 0, 1);

        this._velocity.x = vx / l;
        this._velocity.y = vy / l;
    }

    if (!this._preViewRect || !qc.Rectangle.equals(this._viewRect, this._preViewRect) ||
        !this._preContentRect || !qc.Rectangle.equals(this._contentRect, this._preContentRect)) {
        this._updateScrollBars(offset.x, offset.y);
        this.onValueChange.dispatch(new qc.Point(this.horizontalNormalizedPosition, this.verticalNormalizedPosition));
        this._updatePrevData();
    }
};

/**
 * 设置指定方向上的滚动值
 * @param value {number} - 设置的值
 * @param axis {number} - 坐标轴，0：x轴，1：y轴
 */
ScrollSupport.prototype.setNormalizedPosition = function(value, axis) {
    this._updateBounds();
    if (!this._contentRect) {
        return;
    }
    var contentRect = this.getContentRect();
    var lenProperty = axis ? 'height' : 'width';
    var posProperty = axis ? 'y' : 'x';
    var hiddenLength = this._contentRect[lenProperty] - this._viewRect[lenProperty];
    var contentMinPosition = this._viewRect[posProperty] - value * hiddenLength;
    var newLocalPosition = contentRect[posProperty] + contentMinPosition - this._contentRect[posProperty];
    var localPosition = contentRect[posProperty];
    // 滚动位置相差1个像素时开始处理
    if (Math.abs(localPosition - newLocalPosition) > 1) {
        contentRect[posProperty] = newLocalPosition;
        this.setContentPosition(contentRect.x, contentRect.y);
        // 设置滚动速率为0
        this._velocity[posProperty] = 0;
        this._updateBounds();
    }
};

/**
 * 更新记录的上一次信息
 * @private
 */
ScrollSupport.prototype._updatePrevData = function() {
    var contentRect = this.getContentRect();
    this._preContentPosition = new qc.Point(contentRect.x, contentRect.y);
    this._preContentRect = this._contentRect;
    this._preViewRect = this._viewRect;
};

/**
 * 更新滚动条的滚动信息
 * @param offX {number} - 在水平方向上的偏移
 * @param offY {number} - 在竖直方向上的偏移
 * @private
 */
ScrollSupport.prototype._updateScrollBars = function(offX, offY) {
	var barSize;
    if (this.horizontalScrollBar) {
        if (this._contentRect.width > 0) {
            barSize = (this._viewRect.width - Math.abs(offX)) / this._contentRect.width;
            this.horizontalScrollBar.size = Phaser.Math.clamp(barSize,0, 1);
        }
        else {
            this.horizontalScrollBar.size = 1;
        }
        this.horizontalScrollBar.value = this.horizontalNormalizedPosition;
    }

    if (this.verticalScrollBar) {
        if (this._contentRect.height > 0) {
            barSize = (this._viewRect.height - Math.abs(offY)) / this._contentRect.height;
            this.verticalScrollBar.size = Phaser.Math.clamp(barSize, 0, 1);
        }
        else {
            this.verticalScrollBar.size = 1;
        }
        this.verticalScrollBar.value = this.verticalNormalizedPosition;
    }
};

/**
 * 更新区域信息
 * @private
 */
ScrollSupport.prototype._updateBounds = function() {
    var viewRect = this._viewRect = this.getViewRect();
    this._updateContentBounds();
    if (!this._getContentRect)
        return;

    // 如果内容区域下于显示区域，则模拟内容区域为显示区域大小
    var diffWidth = viewRect.width - this._contentRect.width;
    var diffHeight = viewRect.height - this._contentRect.height;
    if (diffWidth > 0) {
        this._contentRect.width = viewRect.width;
        this._contentRect.x -= diffWidth * this.pivotX;
    }
    if (diffHeight > 0) {
        this._contentRect.height = viewRect.height;
        this._contentRect.y -= diffHeight * this.pivotY;
    }
};

/**
 * 更新内容的区域信息
 * @private
 */
ScrollSupport.prototype._updateContentBounds = function() {
    this._contentRect = this.getContentRect();
};

/**
 * 滚动条滚动时
 * @param node {qc.Node} - 事件发生的节点
 * @param event {qc.WheelEvent} - 拖拽结束事件
 * @private
 */
ScrollSupport.prototype._doWheel = function(node, event) {
    this._updateBounds();

    var delta = new qc.Point(event.source.deltaX, event.source.deltaY);
    if (!this.canVertical) {
        delta.y = 0;
    }
    if (!this.canHorizontal) {
        delta.x = 0;
    }

    var deltaX = delta.x * this.scrollSensitivity;
    var deltaY = delta.y * this.scrollSensitivity;
    this.doScroll(deltaX, deltaY, false);
};

/**
 * 开始拖拽
 * @param node {qc.Node} - 事件发生的节点
 * @param event {qc.DragStartEvent} - 开始拖拽事件
 * @private
 */
ScrollSupport.prototype._doDragStart = function(node, event) {
    if (event.source.eventId !== qc.Mouse.BUTTON_LEFT) {
        return;
    }

    this._updateBounds();
    // 记录当前点击时内容的显示位置
    var contentRect = this.getContentRect();
    this._contentStartPosition = new qc.Point(contentRect.x, contentRect.y);
    this._pointerStartCursor = this.node.toLocal(new qc.Point(event.source.startX, event.source.startY));
    this._isDragging = true;
};

/**
 * 处理拖拽结束
 * @param node {qc.Node} - 事件发生的节点
 * @param event {qc.DragEndEvent} - 拖拽结束事件
 * @private
 */
ScrollSupport.prototype._doDragEnd = function(node, event) {
    if (event.source.eventId !== qc.Mouse.BUTTON_LEFT) {
        return;
    }
    this._isDragging = false;
};

/**
 * 处理拖拽事件
 * @param node {qc.Node} - 事件发生的节点
 * @param event {qc.DragEvent} - 拖拽结束事件
 * @private
 */
ScrollSupport.prototype._doDrag = function(node, event) {
    if (event.source.eventId !== qc.Mouse.BUTTON_LEFT) {
        return;
    }

    this._updateBounds();
    var contentRect = this.getContentRect();
    var cursor = this.node.toLocal(new qc.Point(event.source.x, event.source.y));
    if (!this._pointerStartCursor)
        return;

    var deltaX = this.canHorizontal ? (cursor.x - this._pointerStartCursor.x) : 0;
    var deltaY = this.canVertical ? (cursor.y - this._pointerStartCursor.y) : 0;
    this.doScroll(this._contentStartPosition.x + deltaX - contentRect.x,
        this._contentStartPosition.y + deltaY - contentRect.y,
        true);
};

/**
 * 处理滚动事件
 * @param deltaX {number} - x轴偏移
 * @param deltaY {number} - x轴偏移
 * @param isDrag {boolean} - 是否是拖拽
 */
ScrollSupport.prototype.doScroll = function(deltaX, deltaY, isDrag) {
    var contentRect = this.getContentRect();
    var position = new qc.Point(contentRect.x, contentRect.y);
    position.x += deltaX;
    position.y += deltaY;
    var offset = this._calculateOffset(deltaX, deltaY);
    position.x += offset.x;
    position.y += offset.y;
    if (this.movementType === ScrollView.MOVEMENT_CLAMPED && this.propagationScroll) {
        var parentScroll = this.parent;
        while (!(parentScroll instanceof ScrollView) && parentScroll !== this.game.world) {
            parentScroll = parentScroll.parent;
        }
        if (parentScroll instanceof ScrollView) {
            parentScroll.doScroll(-offset.x, -offset.y, isDrag);
        }
    }
    else if (this.movementType === ScrollView.MOVEMENT_ELASTIC) {
        if (isDrag) {
            if (offset.x !== 0) {
                position.x = position.x - this._rubberDelta(offset.x, this._viewRect.width);
            }
            if (offset.y !== 0) {
                position.y = position.y - this._rubberDelta(offset.y, this._viewRect.height);
            }
        }
        else {
            position.x -= offset.x;
            position.y -= offset.y;
            if (Math.abs(offset.x) > this._viewRect.width) {
                position.x += offset.x - this.game.math.sign(offset.x) * this._viewRect.width;
            }
            if (Math.abs(offset.y) > this._viewRect.height) {
                position.y += offset.y - this.game.math.sign(offset.y) * this._viewRect.height;
            }
        }
    }
    this.setContentPosition(position.x, position.y);
    if (!isDrag) {
        this._updateBounds();
    }
};
/**
 * @author chenqx
 * copyright 2015 Qcplay All Rights Reserved.
 */
/**
 * TableView的适配器，用于提供表格数据信息。
 * 使用时，继承此类，并实现相关接口
 */
var TableViewAdapter = qc.defineBehaviour('com.qici.extraUI.TableViewAdapter', qc.Behaviour, function() {
	var self = this;

	/**
	 * @property {qc.Signal} onDataChange - 当表格数据发生变化时的通知事件
	 */
	self.onDataChange = new qc.Signal();
}, {
	
});

Object.defineProperties(TableViewAdapter.prototype,{

});

/**
 * 通知TableView表格变化
 */
TableViewAdapter.prototype.dispatchDataChange = function() {
	this.onDataChange.dispatch();

};

/**
 * 获取表格大小，x、y同时只能有一个为Infinity
 * @return {{x: number|Infinity, y: number| Infinity}}
 */
TableViewAdapter.prototype.getTableSize = function() {
	return { x: 1, y: Infinity};
};

/**
 * 根据在Table中的点返回对应的单元格
 * @param  {number} x - x轴坐标
 * @param  {number} y - y轴坐标
 * @return {{x: number, y: number}}} 返回点所在的单元格信息
 */
TableViewAdapter.prototype.findCellWithPos = function(x, y) {
	return { 
		x: Math.floor(x / 100),
		y: Math.floor(y / 100)
	};
};

/**
 * 获取节点的显示位置
 */
TableViewAdapter.prototype.getCellRect = function(col, row) {
	return new qc.Rectangle(col * 100, row * 100, 100, 100);
};

/**
 * 节点处于不可见时，回收节点，
 * @param  {qc.Node} cell - 节点
 * @param  {number} col - 所在列
 * @param  {number} row - 所在行
 */
TableViewAdapter.prototype.revokeCell = function(cell, col, row) {

};

/**
 * 节点处于可见时，创建节点，
 * @param  {qc.Node} cell - 节点
 * @param  {number} col - 所在列
 * @param  {number} row - 所在行
 */
TableViewAdapter.prototype.createCell = function(cell, col, row) {

};
/**
 * @author chenqx
 * copyright 2015 Qcplay All Rights Reserved.
 */
/**
 * 一个高效的表格显示组件，
 */
var TableView = qc.defineBehaviour('com.qici.extraUI.TableView', qc.Behaviour, function() {
    var self = this;

    /**
     * @property {[qc.Node]} _cellPool - 缓存的节点
     */
    self._cellPool = [];

    /**
     * @property {[qc.Node]} _usingCell - 使用中的节点
     */
    self._usingCell = [];

    /**
     * @property {qc.Rectangle} _showRect - 当前显示的子节点记录
     */
    self._showRect = new qc.Rectangle(0, 0, 0, 0);

    /**
     * 启用滚动功能
     */
    self.scrollSupport = new com.qici.extraUI.ScrollSupport(
        self.game,
        self.gameObject, 
        self._getViewRect.bind(self), 
        self._getContentRect.bind(self),
        self._setContentPosition.bind(self));

    self.runInEditor = true;
}, {
    content: qc.Serializer.NODE,
    adapterNode: qc.Serializer.NODE,
    horizontalScrollBar: qc.Serializer.NODE,
    verticalScrollBar: qc.Serializer.NODE,
    cellPrefab: qc.Serializer.PREFAB,
    overflow: qc.Serializer.BOOLEAN,
    canHorizontal: qc.Serializer.BOOLEAN,
    canVertical: qc.Serializer.BOOLEAN,
    movementType: qc.Serializer.NUMBER,
    elasticity: qc.Serializer.NUMBER,
    inertia: qc.Serializer.BOOLEAN,
    decelerationRate: qc.Serializer.NUMBER,
    scrollSensitivity: qc.Serializer.NUMBER,
    propagationScroll: qc.Serializer.BOOLEAN,
    extraLeft: qc.Serializer.NUMBER,
    extraRight: qc.Serializer.NUMBER,
    extraTop: qc.Serializer.NUMBER,
    extraBottom: qc.Serializer.NUMBER
});

Object.defineProperties(TableView.prototype, {
    /**
     * @property {qc.Node} adapterNode - 数据提供者所在的节点
     */
    adapterNode : {
        get : function() { return this._adapterNode || this.gameObject; },
        set : function(v) {
            if (v === this._adapterNode) 
                return;

            this._adapterNode = v;
            // 删除当前的数据来源
            if (this._adapter) {
                this._adapter.onDataChange.remove(this._clearTable, this);
                this._adapter = null;
            }
            this._needRebuild = true;
        }
    },

     /**
     * @property {qc.Node} adapter - 数据提供者
     * @readonly
     */
    adapter : {
        get : function() { 
            if (!this._adapter) {
                this._adapter = this.adapterNode && this.adapterNode.getScript('com.qici.extraUI.TableViewAdapter');
                if (this._adapter) {
                    this._adapter.onDataChange.add(this._clearTable, this);
                }
            }
            return this._adapter;
        },
    },

    /**
     * @property {qc.Node} content - 需要滚动显示的内容
     * 注意本节点之下不能挂载子节点，重构表单时会删除所有的子节点。
     */
    content : {
        get : function() {
            if (this._content && this._content._destroy) {
                this.content = null;
            }
            return this._content;
        },
        set : function(value) {
            var self = this;
            if (self._content) {
                self._content.onChildrenChanged.remove(self._doChildrenChanged, self);
                self._content.onLayoutArgumentChanged.remove(self._doLayoutArgumentChanged, self);
            }
            self._content = value;
            self._needRebuild = true;
            if (self._content) {
                self._content.onChildrenChanged.add(self._doChildrenChanged, self);
                self._content.onLayoutArgumentChanged.add(self._doLayoutArgumentChanged, self);
            }
        }
    },

    /**
     * @property {qc.Prefab} cellPrefab - 单元格的预制
     */
    cellPrefab : {
        get : function() { return this._cellPrefab; },
        set : function(v) {
            if (v === this._cellPrefab) 
                return;

            this._cellPrefab = v;
            // 更改显示预制时需要清理所有节点
            if (this.content)
                this.content.removeChildren();
            // 清理缓存的节点
            this._cellPool = [];
            this._needRebuild = true;
        }
    },

    /**
     * @property {boolean} overflow - 是否溢出显示。
     * 当溢出显示时，节点完全超过content的范围才隐藏。
     * 否者只要超出范围就隐藏
     */
    overflow : {
        get : function() { return this._overflow; },
        set : function(v) {
            if (v === this._overflow)
                return;

            this._overflow = v;
            this._needRebuild = true;
        }
    },

    extraLeft : {
        get : function() { return this._extraLeft || 0; },
        set : function(v) {
            if (v === this._extraLeft)
                return;
            this._extraLeft = v;
            this._needRebuild = true;
        }
    },
    extraRight : {
        get : function() { return this._extraRight || 0; },
        set : function(v) {
            if (v === this._extraRight)
                return;
            this._extraRight = v;
            this._needRebuild = true;
        }
    },
    extraTop : {
        get : function() { return this._extraTop || 0; },
        set : function(v) {
            if (v === this._extraTop)
                return;
            this._extraTop = v;
            this._needRebuild = true;
        }
    },
    extraBottom : {
        get : function() { return this._extraBottom || 0; },
        set : function(v) {
            if (v === this._extraBottom)
                return;
            this._extraBottom = v;
            this._needRebuild = true;
        }
    },

    canHorizontal: {
        get : function() {
            return this.scrollSupport ? this.scrollSupport.canHorizontal : null;
        },
        set : function(value) {
            this.scrollSupport && (this.scrollSupport.canHorizontal = value);
        }
    },

    canVertical: {
        get : function() {
            return this.scrollSupport ? this.scrollSupport.canVertical : null;
        },
        set : function(value) {
            this.scrollSupport && (this.scrollSupport.canVertical = value);
        }
    },

    movementType: {
        get : function() {
            return this.scrollSupport ? this.scrollSupport.movementType : null;
        },
        set : function(value) {
            this.scrollSupport && (this.scrollSupport.movementType = value);
        }
    },

    elasticity: {
        get : function() {
            return this.scrollSupport ? this.scrollSupport.elasticity : null;
        },
        set : function(value) {
            this.scrollSupport && (this.scrollSupport.elasticity = value);
        }
    },

    inertia: {
        get : function() {
            return this.scrollSupport ? this.scrollSupport.inertia : null;
        },
        set : function(value) {
            this.scrollSupport && (this.scrollSupport.inertia = value);
        }
    },

    decelerationRate: {
        get : function() {
            return this.scrollSupport ? this.scrollSupport.decelerationRate : null;
        },
        set : function(value) {
            this.scrollSupport && (this.scrollSupport.decelerationRate = value);
        }
    },

    scrollSensitivity: {
        get : function() {
            return this.scrollSupport ? this.scrollSupport.scrollSensitivity : null;
        },
        set : function(value) {
            this.scrollSupport && (this.scrollSupport.scrollSensitivity = value);
        }
    },

    propagationScroll: {
        get : function() {
            return this.scrollSupport ? this.scrollSupport.propagationScroll : null;
        },
        set : function(value) {
            this.scrollSupport && (this.scrollSupport.propagationScroll = value);
        }
    },
    
    /**
     * @property {qc.Node | null} horizontalScrollBar - 水平滚动条
     */
    horizontalScrollBar : {
        get : function() {
            return this.scrollSupport ? this.scrollSupport.horizontalScrollBar : null;
        },
        set : function(value) {
            this.scrollSupport && (this.scrollSupport.horizontalScrollBar = value);
        }
    },

    /**
     * @property {qc.Node | null} verticalScrollBar - 竖直滚动条
     */
    verticalScrollBar : {
        get : function() {
            return this.scrollSupport ? this.scrollSupport.verticalScrollBar : null;
        },
        set : function(value) {
            this.scrollSupport && (this.scrollSupport.verticalScrollBar = value);
        }
    },

    /**
     * @property {number} horizontalNormalizedPosition - 水平方向上滚动的比例
     */
    horizontalNormalizedPosition : {
        get : function() {
            return this.scrollSupport ? this.scrollSupport.horizontalNormalizedPosition : null;
        },
        set : function(value) {
            this.scrollSupport  && this.scrollSupport.setNormalizedPosition(value, 0);
        }
    },

    /**
     * @property {number} verticalNormalizedPosition - 竖直方向上滚动的比例
     */
    verticalNormalizedPosition : {
        get : function() {
            return this.scrollSupport ? this.scrollSupport.verticalNormalizedPosition : null;
        },
        set : function(value) {
            this.scrollSupport  && this.scrollSupport.setNormalizedPosition(value, 1);
        }
    }
});

/**
 * 脚本启动时
 */
TableView.prototype.awake = function() {
};

/**
 * 析构
 */
TableView.prototype.onDestroy = function() {
    var self = this;
    // 清理一些引用的资源
    self.content = null;
    self.cellPrefab = null;
    self._adapter = null;
    self.adapterNode = null;

    self._cellPool = [];
    self._showCell = [];
    self._usingCell = [];
};

/**
 * 更新
 */
TableView.prototype.update = function() {
    if (this.content) {
        this.scrollSupport.pivotX = this.content.pivotX;
        this.scrollSupport.pivotY = this.content.pivotY;
    }
    this.scrollSupport.update(this.game.time.deltaTime);
    if (this._needRebuild) {
        this._rebuildTable();
    }
};

/**
 * 重新排布
 */
TableView.prototype.relayout = function() {
    this._rebuildTable();
};

/**
 * 清理表格
 */
TableView.prototype._clearTable = function() {
    var self = this,
        gameObject = self.gameObject,
        content = self.content;

    content.x = 0;
    content.y = 0;

    // 移除所有子节点
    self.revokeAllCell();
};

/**
 * 回收所有节点
 */
TableView.prototype.revokeAllCell = function() {
    var self = this,
        content = self.content;
    content.removeChildren();
    Array.prototype.push.apply(self._cellPool, self._usingCell);
    self._usingCell = [];
};

/**
 * 废弃一个节点
 * @param  {qc.Node} node - 不在显示区域的需要回收的节点
 */
TableView.prototype._revokeCell = function(node) {
    var self = this;
    self._cellPool.push(node);
    var idx = self._usingCell.indexOf(node);
    if (idx >= 0) {
        self._usingCell.splice(idx, 1);
    }
};

/**
 * 获取一个新的节点。
 * 如果当前缓存中存在可用的节点，则从缓存中获取，否则根据Prefab新建一个。
 * @return {qc.Node} 单元格的节点
 */
TableView.prototype._createCell = function() {
    var self = this;
    if (!self._cellPrefab) {
        return null;
    }
    var node = self._cellPool.pop() || self.game.add.clone(self._cellPrefab, self.gameObject);
    if (node) {
        self._usingCell.push(node);
    }
    return node;
};

/**
 * 获取视图大小
 */
TableView.prototype._getViewRect = function() {
    return this.gameObject.rect;
};

/**
 * 获取内容大小
 */
TableView.prototype._getContentRect = function() {
    var self = this,
        adapter = self.adapter,
        content = self.content;
    if (!content || !adapter) 
        return new qc.Rectangle(0, 0, 0, 0);

    var tableSize = adapter.getTableSize();
    var lastCellX = tableSize.x < Infinity ? tableSize.x - 1 : 0,
        lastCellY = tableSize.y < Infinity ? tableSize.y - 1 : 0;

    var cellRect = adapter.getCellRect(lastCellX, lastCellY);
    return new qc.Rectangle(content.x, content.y, 
        tableSize.x < Infinity ? cellRect.x + cellRect.width : Infinity,
        tableSize.y < Infinity ? cellRect.y + cellRect.height : Infinity);
};

/**
 * 设置当前内容在表格内容中的偏移
 */
TableView.prototype._setContentPosition = function(offsetX, offsetY) {
    var self = this,
        content = self.content;
    if (!content) 
        return;

    content.x = offsetX;
    content.y = offsetY;

    // 修改表格位置后需要马上重新设定显示内容。否则，可能会无法立即及时的更新内容信息
    self._rebuildTable();
};

/**
 * 获取当前内容区域在表格中对应的内容区域
 */
TableView.prototype._getViewRectInTable = function() {
    var self = this,
        gameObject = self.gameObject,
        rect = gameObject.rect,
        content = self.content;
    if (!content)
        return new qc.Rectangle(0, 0, 0, 0);
    return new qc.Rectangle(
        rect.x - self.extraLeft - content.x,
         rect.y - self.extraTop - content.y, 
         rect.width + self.extraLeft + self.extraRight, 
         rect.height + self.extraTop + self.extraBottom);
};

/**
 * 设置单元格的偏移
 */
TableView.prototype._setCellRect = function(cell, x, y, width, height) {
    var self = this,
        content = self.content;
    if (!content || !cell) 
        return;

    cell.x = x;
    cell.y = y;
    cell.width = width;
    cell.height = height;
};


/**
 * 重新构建表格
 */
TableView.prototype._rebuildTable = function() {
    var self = this,
        adapter = self.adapter,
        content = self.content;

    if (!content) {
        return;
    }

    if (!adapter) {
        this._clearTable();
        return;
    }

    var tableSize = adapter.getTableSize();
    if (tableSize.x <= 0 || tableSize.y <= 0 ||
        (tableSize.x === Infinity && tableSize.y === Infinity)) {
        // 没有行，或者没有列，或者行无限且列无限
        // 则清理显示并退出处理
        this._clearTable();
        return;
    }

    var bounds = self._getViewRectInTable();
    var showRect = self._showRect;
    var minX = bounds.x,
        maxX = bounds.x + bounds.width,
        minY = bounds.y,
        maxY = bounds.y + bounds.height;

    var leftUp = adapter.findCellWithPos(minX, minY);
    var rightBottom = adapter.findCellWithPos(maxX, maxY);

    if (!self.overflow) {
        var overLeftUp = adapter.findCellWithPos(minX - 1, minY - 1);
        var overRightBottom = adapter.findCellWithPos(maxX + 1, maxY + 1);
        if (overLeftUp.x === leftUp.x)
            ++leftUp.x;
        if (overLeftUp.y === leftUp.y)
            ++leftUp.y;
        if (overRightBottom.x === rightBottom.x)
            --rightBottom.x;
        if (overRightBottom.y === rightBottom.y)
            --rightBottom.y;
    }

    var startCellX = Math.max(leftUp.x, 0),
        startCellY = Math.max(leftUp.y, 0),
        endCellX = Math.min(rightBottom.x, tableSize.x - 1),
        endCellY = Math.min(rightBottom.y, tableSize.y - 1);

    var children = content.children;
    var totalLength = showRect.width * showRect.height;

    // 显示与实际需要的不匹配，全部销毁后重置
    if (totalLength !== children.length) {
        content.removeChildren();
        showRect.setTo(0, 0, 0, 0);
        totalLength = 0;
    }

    // 先移出不需要显示的部分
    var node;
    var yPos, xPos, yEnd, xEnd;
    var childIdx = totalLength - 1;
    for (yPos = showRect.y + showRect.height -1, yEnd = showRect.y; yPos >= yEnd; --yPos) {
        for (xPos = showRect.x + showRect.width - 1, xEnd = showRect.x; xPos >= xEnd; --xPos, --childIdx) {
            if (xPos >= startCellX && xPos <= endCellX &&
                yPos >= startCellY && yPos <= endCellY) 
                continue;
            node = content.removeChildAt(childIdx);
            adapter.revokeCell(node, xPos, yPos);
            self._revokeCell(node);
        }
    }

    var currStartX = Math.max(showRect.x, startCellX),
        currStartY = Math.max(showRect.y, startCellY),
        currEndX = Math.min(showRect.x + showRect.width - 1, endCellX),
        currEndY = Math.min(showRect.y + showRect.height - 1, endCellY);

    // 当前需要显示的宽，高
    var showWidth = endCellX - startCellX + 1,
        showHeight = endCellY - startCellY + 1;
    if (showWidth > 0 && showHeight > 0) {
        childIdx = 0;
        for (yPos = startCellY; yPos <= endCellY; ++yPos) {
            for (xPos = startCellX; xPos <= endCellX; ++xPos, ++childIdx) {
                if (xPos >= currStartX && xPos <= currEndX &&
                    yPos >= currStartY && yPos <= currEndY)
                    continue;
                node = self._createCell();
                if (!node) {
                    continue;
                }
                content.addChildAt(node, childIdx);
                var cellRect = adapter.getCellRect(xPos, yPos);
                self._setCellRect(node, cellRect.x, cellRect.y, cellRect.width, cellRect.height);
                adapter.createCell(node, xPos, yPos);
            }
        }
    }
    showRect.setTo(startCellX, startCellY, showWidth, showHeight);
};

/**
 * 当子节点变化时
 * @private
 */
TableView.prototype._doChildrenChanged = function(event) {
    this._needRebuild = true;
};

TableView.prototype._doLayoutArgumentChanged = function() {
    this._needRebuild = true;
};

/**
 * @author chenx
 * @date 2015.11.13
 * copyright 2015 Qcplay All Rights Reserved.
 */

/**
 * tween 回调函数
 * @class qc.TweenFunction
 */
var TweenFunction = qc.defineBehaviour('qc.TweenFunction', qc.Tween, function() {
    var self = this;

    /**
     * @property {string} func - 回调函数名
     */
    self.funcName = '';

    /**
     * @property {function} _func - 回调函数
     */
    self.func = null;

    // 回调函数的属主
    self.funcContext = null;

    // 默认情况下不可用
    self.enable = false;
},{
    funcName: qc.Serializer.STRING
});

// 菜单上的显示
TweenFunction.__menu = 'Plugins/TweenFunction';

Object.defineProperties(TweenFunction.prototype, {
    funcName: {
        get: function() { return this._funcName; },
        set: function(v) {
            if (v === this._funcName) return;

            this._funcName = v;
            this.onEnable();
        }
    }
});

// 组件 enabled
// gameObject 所有脚本挂载完后，才调用该接口，在此处将函数名转换成函数
TweenFunction.prototype.onEnable = function() {

    if (this._funcName.length <= 0)
        return;

    // 遍历 gameObject 及其所有的 scripts，查找回调函数
    this.func = this.gameObject[this._funcName];
    var classList = [];
    if (this.func)
    {
        // 记录存在该函数名的类名
        classList.push(this.gameObject.class);
        this.func = this.func.bind(this.gameObject);
        //this.funcContext = this.gameObject;
    }

    var self = this;
    this.gameObject.scripts.forEach(function(scriptOb) {
        var func = scriptOb[self._funcName];
        if (func)
        {
            // 记录存在该函数名的类名
            classList.push(scriptOb.class);
            self.func = func.bind(scriptOb);
            //this.funcContext = scriptOb;
        }
    });

    if (!self.func && this.enable)
        this.game.log.important('TweenFunction({0}) not find!', this._funcName);

    if (classList.length <= 1)
        return;

    // 存在多个相同名字的函数，提示错误
    self.game.log.error('Error: Exist multi functions with same name: {0}', classList);

    if (self.game.device.editor === true)
    {
        // 在编辑器中，弹出错误提示框
        var G = window.parent && window.parent.G;
        if (G)
        {
            var str = G._('TweenFunction func error') + classList;
            G.notification.error(str);
        }
    }
};


// 帧调度
TweenFunction.prototype.onUpdate = function(factor, isFinished) {
    if (typeof(this.func) != 'function')
        return;

    if (this.duration == 0 && !isFinished)
        // 表示该回调只在完成的调用一次
        return;

    // 调用回调函数
    this.func(factor, this.duration);
};

/**
 * 开始变化
 * @param node {qc.Node} - 需要改变的节点
 * @param duration {number} - 经历的时间
 * @param funcName {string} - 回调函数名
 * @returns {qc.TweenFunction}
 */
TweenFunction.begin = function(node, duration, funcName) {
    var tween = qc.Tween.begin('qc.TweenFunction', node, duration);
    tween.funcName = funcName;

    return tween;
};

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

var FollowMsg = qc.defineBehaviour('qc.Koala.ui.FollowMsg', qc.Behaviour, function() {
}, {
    label : qc.Serializer.NODE,
    followBtn : qc.Serializer.NODE,
    closeBtn : qc.Serializer.NODE
});

FollowMsg.prototype.awake = function() {
    // 监听关注按钮点击事件
    this.addListener(this.followBtn.onClick, this._follow, this);

    // 监听关闭按钮点击事件
    this.addListener(this.closeBtn.onClick, this.hide, this);

    // 监听显示关注页面事件
    this.addListener(qc.Koala.showFollowMsg, this.show, this);
};

/**
 * 初始化文本
 */
FollowMsg.prototype.initLabel = function () {
    if (qc.qcWeChat.isWeChat() &&
        qc.Koala.logic.me.userInfo &&
        !qc.Koala.logic.me.userInfo.subscribe) {
        this.label.text = '亲，需要[#76ffef]关注公众号[-]后才能查看排行榜哦！';
    }
    else {
        this.label.text = '亲，你要[#76ffef]关注公众号[-]并通过[#76ffef]微信登录[-]，才能查看排行榜哦！';
    }
};

/**
 * 关注公众号
 */
FollowMsg.prototype._follow = function () {
    document.location.href = qc.Koala.logic.config.followHref;
};

/**
 * 隐藏界面
 */
FollowMsg.prototype.hide = function() {
    this.gameObject.visible = false;
};

/**
 * 显示界面
 */
FollowMsg.prototype.show = function () {
    this.gameObject.visible = true;

    this.initLabel();
};

var Config = qc.Koala.logic.Config = function(excel) {
	if (!excel) {
		excel = qc.Koala.game.assets.load('config');
	}

	var sheet = excel.findSheet('config');
	if (sheet) {
		sheet.rows.forEach(function(row) {
			var val = row.value;
			if (row.type === 'number') 
				val *= 1;
			this[row.key] = val;
		}, this);
	}
};

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

var PercentInfo = function(row) {
    this.id = row.id * 1;
    this.min = row.min * 1;
    this.max = row.max * 1 || Infinity;
    this.base = row.base * 1;
    this.space = row.space * 1;
    this.increment = row.increment * 1;
};

var Percent = qc.Koala.logic.Percent = function(excel) {
    // 百分比信息列表
	this.infoList = [];

	if (!excel) {
		excel = qc.Koala.game.assets.load('config');
	}

	var sheet = excel.findSheet('percent');
	if (sheet) {
		sheet.rows.forEach(function(row) {
			this.infoList.push(new PercentInfo(row));
		}, this);
	}
};

Percent.prototype = {};
Percent.prototype.constructor = Percent;

/**
 * 获取世界排名百分比
 * @param  {number} score - 当前分数
 */
Percent.prototype.getPercent = function (score) {
    var info = null;
    for (var i = 0, len = this.infoList.length; i < len; i++) {
        info = this.infoList[i];
        if (score > info.min && score <= info.max)
            break;
    }

    if (info.space === 0)
        return info.base;

    var percent = info.base;
    percent += Math.floor((score - info.min) / info.space) * info.increment;
    return percent;
};

var PillarInfo = function(row) {
	this.id = row.id * 1;
	this.minLv = row.minLv * 1;
	this.maxLv = row.maxLv * 1 || Infinity;
	this.thickness = row.thickness * 1;
	this.top = row.top * 1;
	this.headIcon = row.headIcon;
	this.scoreRect = row.scoreRect * 1 || Infinity;
};

var Pillar = qc.Koala.logic.Pillar = function(excel) {
	// 柱子信息列表
	this.infoList = [];

	// 关卡与柱子粗细值对应表
	this.infoMap = {};

	if (!excel) {
		excel = qc.Koala.game.assets.load('config');
	}

	var sheet = excel.findSheet('pillar');
	if (sheet) {
		sheet.rows.forEach(function(row) {
			this.infoList.push(new PillarInfo(row));
		}, this);
	}
};

/**
 * 获取柱子粗细值
 * @return {number}
 */
Pillar.prototype.getInfo = function(level) {
	var info = this.infoMap[level];
	if (!info) {
		var p = this._find(level);
		info = {
			thickness : qc.Koala.logic.config.pillarWidth,
			top : qc.Koala.logic.config.pillarTopMin,
			headIcon : qc.Koala.logic.config.pillarHeadIcon,
			scoreRect : Infinity
		};
		if (p) {
			info.thickness *= p.thickness;
			info.top = p.top * qc.Koala.logic.config.pillarTopMax;
			info.headIcon = p.headIcon;
			info.scoreRect = p.scoreRect;
		}
		this.infoMap[level] = info;
	}
	return info;
};

/**
 * 遍历获取柱子粗细百分比
 * @param  {number} level - 关卡数
 * @return {number}
 */
Pillar.prototype._find = function(level) {
	for (var i = 0, len = this.infoList.length; i < len; i++) {
		var info = this.infoList[i];
		if (level < info.minLv)
			continue;
		if (level >= info.minLv && level <= info.maxLv)
			return info;
	}
	return null;
};

var ScoreInfo = function(row) {
    this.id = row.id * 1;
    this.min = row.min * 1;
    this.max = row.max * 1;
    this.value = row.value * 1;

    this.scoreImg = row.scoreImg;
    this.labelImg = row.labelImg;

    this.effectName = row.effectName;
};

var Score = qc.Koala.logic.Score = function(excel) {
    // 分数信息列表
	this.infoList = [];

    // 默认的分数信息
    this.defaultInfo = null;

	if (!excel) {
		excel = qc.Koala.game.assets.load('config');
	}

	var sheet = excel.findSheet('score');
	if (sheet) {
		sheet.rows.forEach(function(row) {
			this.infoList.push(new ScoreInfo(row));
		}, this);
	}
};

/**
 * 获取分数
 * @param  {number} distance - 考拉降落点到柱子中心的距离
 * @param  {number} scoreRect - 柱子的分数区域
 * @return {number}
 */
Score.prototype.getScore = function(distance, scoreRect) {
    console.log('scoreRect:',scoreRect);
    // 如果超出分数区域，则返回游戏最小分
    if (distance > scoreRect) {
        if (!this.defaultInfo)
            this.defaultInfo = {
                value : qc.Koala.logic.config.minScore,
                labelImg : qc.Koala.logic.config.labelImg,
                scoreImg : qc.Koala.logic.config.scoreImg
            };
        return this.defaultInfo;
    }

    // 通过距离计算得分
    var info = null;
    for (var i = 0, len = this.infoList.length; i < len; i++) {
        info = this.infoList[i];
        if (distance > info.min && distance <= info.max)
            break;
    }
    return info;
};

var ShareInfo = function(data) {
	this.id = data.id * 1;
	this.min = data.min * 1;
	this.max = data.max * 1;
	this.max = this.max == null ? Infinity : this.max;
	this.content = data.content;
};

var Share = qc.Koala.logic.Share = function(excel) {
	this.shareMap = {};

	if (!excel)
        excel = qc.Island.game.assets.find('config');

    var sheet = excel.findSheet('share');

    for (var i in sheet.rows) {
        var row = sheet.rows[i];
        this.shareMap[row.id] = new ShareInfo(row);
    }

	//qc.Koala.onScoreChange.add(this.share, this);
};

Share.prototype = {};
Share.prototype.constructor = Share;

Share.prototype.getContent = function(score) {
	for (var key in this.shareMap) {
		var info = this.shareMap[key];
		if (score >= info.min && score <= info.max) {
			return info.content.replace('{0}', score);
		}
	}
};

//Share.prototype.share = function(score) {
//    //var content = this.getContent(score);
//	//if (qc.qcWeChat) {
//	//	qc.qcWeChat.share(
//     //       content,
//	//		qc.Koala.logic.config.shareIcon,
//	//		'',
//	//		qc.Koala.logic.config.shareDir
//	//	);
//	//}
//};

var WindInfo = function(row) {
    this.id = row.id * 1;
    this.minLv = row.minLv * 1;
    this.maxLv = row.maxLv * 1 || Infinity;
    this.minWind = row.minWind * 1;
    this.maxWind = row.maxWind * 1;
};

var Wind = qc.Koala.logic.Wind = function(excel) {
    // 风力信息列表
	this.infoList = [];

    // 风力范围速查表
    this.infoMap = {};

	if (!excel) {
		excel = qc.Koala.game.assets.load('config');
	}

	var sheet = excel.findSheet('wind');
	if (sheet) {
		sheet.rows.forEach(function(row) {
			this.infoList.push(new WindInfo(row));
		}, this);
	}
};

/**
 * 获取风力方向及大小
 * @param  {number} level - 关卡值
 * @return {object}
 *         direction : 方向，-1：向左，1：向右
 *         value : 风力值，0 ~ 100 之间的整数
 */
Wind.prototype.getWind = function(level) {
    // 从速查表中获取风力信息
    var info = this.infoMap[level],
        dir = qc.Koala.Math.random(0, 1);
    // 随机风向
    dir = (dir === 0 ? -1 : dir);
    if (!info) {
        // 遍历风力值列表
        for (var i = 0, len = this.infoList.length; i < len; i++) {
            info = this.infoList[i];
            if (level >= info.minLv && level <= info.maxLv) {
                // 将风力值信息缓存到速查表中
                this.infoMap[level] = info;
                break;
            }
        }
    }

    // 返回风向及风力值
    return {
        direction : dir,
        value : qc.Koala.Math.random(info.minWind, info.maxWind)
    };
};

/**
 * @author weism version 03.2
 * @copyright 2015 Qcplay All Rights Reserved.
 */

var QcWeChat = qc.defineBehaviour('qc.QcWeChat', qc.Behaviour, function() {
    var self = this;

    qc.qcWeChat = this;

    /**
     * @property {string} shareAppId - 用于分享的微信公众号的appid
     */
    self.shareAppId = '';

    /**
     * @property {string} gameName - 游戏名字
     */
    self.gameName = '';

    /**
     * @property {string} wxAppId - 用于登录的微信公众号的appid
     */
    self.wxAppId = '';

    /**
     * @property {string} webAppId - 网站应用的appid
     */
    self.webAppId = '';

    /**
     * @property {string} domain
     *  域名（存放php文件的域名地址，例如：http://engine.zuoyouxi.com/wx/）
     *  域名最后面以 '/' 结束
     */
    self.domain = '';

    /**
     * @property {string} gameDomain
     *   游戏服务器存放的域名（即放game_client文件的域名地址）
     *   例如： http://engine.zuoyouxi.com/teris/
     */
    self.gameDomain = '';

    /**
     * @property {string} extendParams
     *   微信登录时的扩展参数，格式为json字符串，可用于传递一些自定义信息
     *   例如： {"game":1}
     */
    self.extendParams = '';

    /**
     * @property {boolean} redirectCurrentUrl
     *   = true：使用游戏页直接换取code。当在微信公众号后台配置了游戏域名（gameDomain）为回调地址时采用
     *   = false：使用this.domain + 'code.php'作为接收code的回调页，之后再跳转到本页面。当微信公众号后台配置的是domain时采用
     *            这种情况下，游戏的域名和公众号后台配置的可以是不一样的，并且多个游戏可以共用一个公众号的信息。缺点是浏览器会有两次跳转
     */
    self.redirectCurrentUrl = true;

    /**
     * @property {boolean} debug - 微信接口的debug是否打开，在发布时一定要关闭哦
     */
    self.debug = false;

    /**
     * 微信分享的接口实例
     */
    self.wx = new qc.QCWX();
    window.QcWx = self.wx;

    /**
     * @property {qc.Signal} onInitWx - 初始化微信成功
     */
    self.onInitWx = new qc.Signal();

    /**
     * @property {qc.Signal} onStartLogin - 开始登录的事件
     */
    self.onStartLogin = new qc.Signal();

    /**
     * @property {qc.Signal} onLogin - 登录成功/失败的事件
     */
    self.onLogin = new qc.Signal();

    /**
     * @property {qc.Signal} sessionExpired - 会话过期的事件
     */
    self.sessionExpired = new qc.Signal();

    /**
     * @type {qc.Signal} onShare - 用户点击分享的事件
     */
    self.onShare = new qc.Signal();

    /**
     * @property {object} user - 微信的用户信息
     * @readonly
     */
    self.user = null;

    /**
     * @property {string} status - 当前的登录状态
     *   loggingIn - 登录中
     *   loggedIn - 已登录
     *   expired - 会话过期
     */
    self.status = '';

    /**
     * @property {string} shareLink - 分享链接地址
     */
    self.shareLink = "";

    /**
     * @property {object} _shareBody - 分享的内容
     */
    self._shareBody = null;

    /**
     * @property {boolean} shareSignSuccess - 获取分享签名状态
     */
    self.shareSignSuccess = false;

    /**
     * @property {string} shareDir - 分享链接的目录
     */
    self.shareDir = "";

}, {
    gameName: qc.Serializer.STRING,
    shareAppId: qc.Serializer.STRING,
    wxAppId: qc.Serializer.STRING,
    webAppId: qc.Serializer.STRING,
    domain: qc.Serializer.STRING,
    gameDomain: qc.Serializer.STRING,
    shareDir: qc.Serializer.STRING,
    redirectCurrentUrl: qc.Serializer.BOOLEAN,
    debug: qc.Serializer.BOOLEAN
});
//QcWeChat.__menu = 'Plugins/QcWeChat';

// 初始化处理
QcWeChat.prototype.awake = function() {
    // 请求签名信息
    var self = this;
    if (!self.domain) return;

    var url = self.domain + 'index.php?cmd=sign&appid=' + self.shareAppId + '&url=' + encodeURIComponent(window.location.href);
    self.game.log.trace('开始请求微信分享的签名信息：{0}', url);
    qc.AssetUtil.get(url, function(r) {
        self.game.log.trace('获取签名成功：' + r);
        self.parseSign(r);
    }, function() {
        console.error('获取签名信息失败');
    });

    // 加载js库
    self.loadWXLib();

    // 获取code
    self._code = this.getParam('code');

    self._state = this.getParam('state');
    if (self._code && (self.isWeChat() || this.game.device.desktop)) {
        // 请求换取token，如果失败需要重新请求登录
        self.status = 'loggingIn';
        self.game.timer.add(1, function() {
            self.requestToken(self._code);
        });
    }
};

// 析构的处理
QcWeChat.prototype.onDestroy = function() {
    if (this.timer) {
        this.game.timer.remove(this.timer);
    }
};

/**
 * 请求微信登录
 */
QcWeChat.prototype.login = function() {
    //if (this.isWeChat()) {
    if (!this.game.device.desktop) {
        this.loginInWX();
        return;
    }
    this.loginInWeb();
};

/**
 * 调用微信授权
 * @private
 */
QcWeChat.prototype._gotoAuth = function() {
    var url = '',
        redirectUri = window.location.origin + window.location.pathname;
    if (this.redirectCurrentUrl) {
        url = "https://open.weixin.qq.com/connect/oauth2/authorize?" +
            "appid=" + this.wxAppId +
            "&redirect_uri=" + encodeURIComponent(redirectUri) +
            "&response_type=code&scope=snsapi_userinfo&state=weixin#wechat_redirect";
    }
    else {
        // 跳转到code.php页面，再跳转回本页面
        url = "https://open.weixin.qq.com/connect/oauth2/authorize?" +
            "appid=" + this.wxAppId +
            "&redirect_uri=" + encodeURIComponent(this.domain + 'code.php') +
            "&response_type=code&scope=snsapi_userinfo" +
            "&state=" + encodeURIComponent(redirectUri) +
            "#wechat_redirect";
    }
    window.location.href = url;
}
// 微信内登陆
QcWeChat.prototype.loginInWX = function() {
    // 如果在微信浏览器上
    if (this.isWeChat()) {
        this.requestToken(this._code);
        return;
    }
    this._gotoAuth();
};

// 微信外登录
QcWeChat.prototype.loginInWeb = function() {
    var url = '',
        redirectUri = window.location.origin + window.location.pathname;
    if (this.redirectCurrentUrl) {
        url = "https://open.weixin.qq.com/connect/qrconnect?" +
            "appid=" + this.webAppId +
            "&redirect_uri=" + encodeURIComponent(redirectUri) +
            "&response_type=code&scope=snsapi_login&state=pc#wechat_redirect";
    }
    else {
        // 跳转到code.php页面，再跳转回本页面
        url = "https://open.weixin.qq.com/connect/qrconnect?" +
            "appid=" + this.webAppId +
            "&redirect_uri=" + encodeURIComponent(this.domain + 'code.php') +
            "&response_type=code&scope=snsapi_login" +
            "&state=" + encodeURIComponent(redirectUri) +
            "#wechat_redirect";
    }
    window.location.href = url;
};

// 解析签名信息
QcWeChat.prototype.parseSign = function(r) {
    var self = this;
    var sign = JSON.parse(r);
    self.timeStamp = sign.timestamp;
    self.nonceStr = sign.nonceStr;
    self.signature = sign.signature;
    self.shareLink = sign.shareLink;
    //window.QcWx.shareLink = self.shareLink;

    if (!self.jweixin) {
        // 微信接口尚未载入，延迟继续检测
        self.game.timer.add(500, function() {
            self.parseSign(r);
        });
        return;
    }

    // 调用微信的初始化接口
    self.game.log.trace('开始初始化微信接口');
    self.wx.debug = self.debug;
    self.wx.init({
        timeStamp: self.timeStamp,
        nonceStr: self.nonceStr,
        signature: self.signature,
        appId: self.shareAppId
    }, function() {
        self.game.log.trace('初始化微信接口完成。');
        self.shareSignSuccess = true;
        self.wx.share(self.onShare);
        self.onInitWx.dispatch();
    });
};

// 动态加载wx的库
QcWeChat.prototype.loadWXLib = function() {
    var self = this;
    var src = "http://res.wx.qq.com/open/js/jweixin-1.0.0.js";
    var js = document.createElement('script');
    js.onerror = function() {
        console.error('加载jweixin库失败');
    };
    js.onload = function() {
        // 标记加载完成了
        self.game.log.trace('微信接口下载完成');
        self.jweixin = true;
    };
    js.setAttribute('src', src);
    js.setAttribute('type', 'text/javascript');
    document.getElementsByTagName('head')[0].appendChild(js);
};

// 当前是否运行在微信客户端
QcWeChat.prototype.isWeChat = function() {
    var ua = window.navigator.userAgent.toLowerCase();
    return ua.match(/MicroMessenger/i) == 'micromessenger';
};

// 获取url的参数
QcWeChat.prototype.getParam = function(key) {
    var r = new RegExp("(\\?|#|&)" + key + "=([^&#]*)(&|#|$)");
    var m = location.href.match(r);
    return decodeURIComponent(!m ? "" : m[2]);
};

// 使用code换取token
QcWeChat.prototype.requestToken = function(code) {
    //this.gameName = "Koala";
    var self = this,
        url = self.gameDomain + "login03.php?code=" + code + "&gameName=" + self.gameName;
    //if (!self.isWeChat()) url += "&web=1";
    if (this.game.device.desktop) url += "&web=1";

    self.onStartLogin.dispatch();
    qc.AssetUtil.get(url, function(r) {
        var data = JSON.parse(r);
        if (data.error) {
            if (data.errorCode && data.errorCode == 301) {
                // 跳转到授权页面
                if (self.game.device.desktop) {
                    self.loginInWeb();
                    return;
                }
                self._gotoAuth();
                return;
            }

            // 换取token失败，重新请求登录
            self.game.log.error('换取token失败，重新请求登录');
            // 登陆失败 不重新登陆
            //self.login();
            self.onLogin.dispatch("fail");
            return;
        }

        // 登录成功了，抛出事件
        self.game.log.trace('登录成功：{0}', r);
        self.status = 'loggedIn';
        self.user = data;
        self.onLogin.dispatch("success");

        // 定期刷新access_token，并保持会话
        self.timer = self.game.timer.loop(5 * 60000, self.refreshToken, self);
    }, function(r) {
        self.onLogin.dispatch("fail");
    });
};

// 刷新token
QcWeChat.prototype.refreshToken = function() {
    var self = this,
        url = self.gameDomain + "refresh.php";
    //if (!self.isWeChat()) url += "?web=1";
    if (this.game.device.desktop) url += "?web=1";
    qc.AssetUtil.get(url, function(r) {
        var data = JSON.parse(r);
        if (data.error) {
            // 刷新token失败了，抛出事件
            self.status = 'expired';
            self.game.timer.remove(self.timer);
            delete self.timer;
            self.sessionExpired.dispatch();
            return;
        }

        // 成功了，啥也不用处理
        self.game.log.trace('刷新Access Token成功。');
    });
};
// version 03.2
var QCWX = qc.QCWX = function() {
    var self = this;

    self.title = '';
    self.imgUrl = '';
    self.desc = '';
    self.url = '';
    self.sign = null;
    self.ready = false;
    self.debug = false;
};
QCWX.prototype = {};
QCWX.prototype.constructor = QCWX;

/**
 * 初始化微信接口
 */
QCWX.prototype.init = function(sign, callback) {
    var self = this;
    self.sign = sign;

    // 不支持微信接口？
    if (!window.wx) {
        return;
    }
    wx.config({
        debug: self.debug,
        appId: sign.appId,
        timestamp: sign.timeStamp,
        nonceStr: sign.nonceStr,
        signature: sign.signature,
        jsApiList: [
            'onMenuShareTimeline', 'onMenuShareQQ', 'onMenuShareQZone', 'onMenuShareAppMessage', 'onMenuShareWeibo',
            'startRecord', 'stopRecord', 'onVoiceRecordEnd', 'playVoice', 'pauseVoice', 'stopVoice', 'onVoicePlayEnd',
            'uploadVoice', 'downloadVoice', 'chooseImage', 'previewImage', 'uploadImage', 'downloadImage',
            'translateVoice', 'getNetworkType', 'openLocation', 'getLocation', 'closeWindow', 'scanQRCode'
        ]
    });

    wx.ready(function() {
        // 标记下已经初始化完毕了
        self.ready = true;
        if (callback) callback();
    });
};

/**
 * 分享接口
 */
QCWX.prototype.share = function(shareSignal) {
    var self = this;
    if (!self.ready) {
        console.error('尚未初始化完成');
        return;
    }

    var body = {
        title: self.title,
        desc: "",
        trigger: function() {
            if (!shareSignal) return;
            shareSignal.dispatch(body);
            body.link = qc.qcWeChat.shareLink + qc.qcWeChat.shareDir;
        }
    };

    //alert(JSON.stringify(body));

    // 分享到朋友圈
    wx.onMenuShareTimeline(body);

    // 分享给朋友
    wx.onMenuShareAppMessage(body);

    // 分享到QQ
    wx.onMenuShareQQ(body);

    // 分享到腾讯微博
    wx.onMenuShareWeibo(body);

    // 分享到QQ空间
    wx.onMenuShareQZone(body);
};

/**
 * 拍照或从手机相册中选图
 * @param {number} count - 图片的数量
 */
QCWX.prototype.chooseImage = function(count, sizeType, sourceType, callback) {
    var self = this;
    if (!self.ready) {
        console.error('尚未初始化完成');
        return;
    }

    if (!sizeType) sizeType = ['original', 'compressed'];
    if (!sourceType) sourceType = ['album', 'camera'];

    wx.chooseImage({
        count: count,
        sizeType: sizeType,
        sourceType: sourceType,
        success: function(res) {
            if (callback) callback(res.localIds);
        }
    });
};

/**
 * 预览图片
 */
QCWX.prototype.previewImage = function(current, urls) {
    var self = this;
    if (!self.ready) {
        console.error('尚未初始化完成');
        return;
    }

    current = current || '';
    urls = urls || [];
    wx.previewImage({
        current: current,
        urls: urls
    });
};

/**
 * 上传图片，有效期为3天
 */
QCWX.prototype.uploadImage = function(localId, isShowProgressTips, callback) {
    var self = this;
    if (!self.ready) {
        console.error('尚未初始化完成');
        return;
    }
    wx.uploadImage({
        localId: localId,
        isShowProgressTips: isShowProgressTips ? 1 : 0,
        success: function(res) {
            if (callback) callback(res.serverId);
        }
    });
};

/**
 * 下载图片
 */
QCWX.prototype.downloadImage = function(serverId, isShowProgressTips, callback) {
    var self = this;
    if (!self.ready) {
        console.error('尚未初始化完成');
        return;
    }
    wx.downloadImage({
        serverId: serverId,
        isShowProgressTips: isShowProgressTips ? 1 : 0,
        success: function(res) {
            if (callback) callback(res.localId);
        }
    });
};

/**
 * 开始录音
 */
QCWX.prototype.startRecord = function() {
    var self = this;
    if (!self.ready) {
        console.error('尚未初始化完成');
        return;
    }
    wx.startRecord();
};

/**
 * 停止录音
 */
QCWX.prototype.stopRecord = function(callback) {
    var self = this;
    if (!self.ready) {
        console.error('尚未初始化完成');
        return;
    }
    wx.stopRecord({
        success: function(res) {
            if (callback) callback(res.localId);
        }
    });
};

/**
 * 监听录音自动停止
 */
QCWX.prototype.onVoiceRecordEnd = function(callback) {
    var self = this;
    if (!self.ready) {
        console.error('尚未初始化完成');
        return;
    }
    wx.onVoiceRecordEnd({
        complete: function(res) {
            if (callback) callback(res.localId);
        }
    });
};

/**
 * 播放语音
 */
QCWX.prototype.playVoice = function(localId) {
    var self = this;
    if (!self.ready) {
        console.error('尚未初始化完成');
        return;
    }
    wx.playVoice({
        localId: localId
    });
};

/**
 * 暂停播放语音
 */
QCWX.prototype.pauseVoice = function(localId) {
    var self = this;
    if (!self.ready) {
        console.error('尚未初始化完成');
        return;
    }
    wx.pauseVoice({
        localId: localId
    });
};

/**
 * 暂停播放语音
 */
QCWX.prototype.stopVoice = function(localId) {
    var self = this;
    if (!self.ready) {
        console.error('尚未初始化完成');
        return;
    }
    wx.stopVoice({
        localId: localId
    });
};

/**
 * 监听语音播放完毕
 */
QCWX.prototype.onVoicePlayEnd = function(callback) {
    var self = this;
    if (!self.ready) {
        console.error('尚未初始化完成');
        return;
    }
    wx.onVoicePlayEnd({
        success: function (res) {
            if (callback) callback(res.localId);
        }
    });
};

/**
 * 上传语音，有效期为3天
 */
QCWX.prototype.uploadVoice = function(localId, isShowProgressTips, callback) {
    var self = this;
    if (!self.ready) {
        console.error('尚未初始化完成');
        return;
    }
    wx.uploadVoice({
        localId: localId,
        isShowProgressTips: isShowProgressTips ? 1 : 0,
        success: function(res) {
            if (callback) callback(res.serverId);
        }
    });
};

/**
 * 下载语音
 */
QCWX.prototype.downloadVoice = function(serverId, isShowProgressTips, callback) {
    var self = this;
    if (!self.ready) {
        console.error('尚未初始化完成');
        return;
    }
    wx.downloadVoice({
        serverId: serverId,
        isShowProgressTips: isShowProgressTips ? 1 : 0,
        success: function(res) {
            if (callback) callback(res.localId);
        }
    });
};

/**
 * 语音识别
 */
QCWX.prototype.translateVoice = function(localId, isShowProgressTips, callback) {
    var self = this;
    if (!self.ready) {
        console.error('尚未初始化完成');
        return;
    }
    wx.translateVoice({
        localId: localId,
        isShowProgressTips: isShowProgressTips ? 1 : 0,
        success: function(res) {
            if (callback) callback(res.translateResult);
        }
    });
};

/**
 * 获取网络状态：2g 3g 4g wifi
 */
QCWX.prototype.getNetworkType = function(callback) {
    var self = this;
    if (!self.ready) {
        console.error('尚未初始化完成');
        return;
    }
    wx.getNetworkType({
        success: function(res) {
            if (callback) callback(res.networkType);
        }
    });
};

/**
 * 查看位置
 */
QCWX.prototype.openLocation = function(lat, lng, name, address, scale, infoUrl) {
    var self = this;
    if (!self.ready) {
        console.error('尚未初始化完成');
        return;
    }
    lat = lat || 0;
    lng = lng || 0;
    scale = scale || 1;
    name = name || '';
    address = address || '';
    infoUrl = infoUrl || '';
    wx.openLocation({
        latitude: lat,
        longitude: lng,
        name: name,
        address: address,
        scale: scale,
        infoUrl: infoUrl
    });
};

/**
 * 获取当前位置
 * @param {string} type - 'wgs84'(默认)，'gcj02'(火星坐标)
 * 返回的结果中，包含如下信息：
 *   latitude
 *   longitude
 *   speed
 *   accuracy
 */
QCWX.prototype.getLocation = function(type, callback) {
    var self = this;
    if (!self.ready) {
        console.error('尚未初始化完成');
        return;
    }
    type = type || 'wgs84';
    wx.getLocation({
        type: type,
        success: callback
    });
};

/**
 * 微信扫一扫
 */
QCWX.prototype.scanQRCode = function(needResult, callback) {
    var self = this;
    if (!self.ready) {
        console.error('尚未初始化完成');
        return;
    }
    wx.scanQRCode({
        needResult: needResult,
        scanType: ["qrCode","barCode"],
        success: function(res) {
            if (callback) callback(res.resultStr);
        }
    });
};

/**
 * 关闭当前网页
 */
QCWX.prototype.closeWindow = function() {
    var self = this;
    if (!self.ready) {
        console.error('尚未初始化完成');
        return;
    }
    wx.closeWindow();
};

/**
 * 微信支付
 */
QCWX.prototype.chooseWXPay = function() {
    // 后续增加
};

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

/**
 * @author luohj version 03.2
 * @copyright 2015 Qcplay All Rights Reserved.
 */

var Interactive = qc.defineBehaviour('qc.Interactive', qc.Behaviour, function() {
    qc.interactive = this;
}, {
    gameName: qc.Serializer.STRING,
    serverUrl: qc.Serializer.STRING
});

/**
 * 上传分数
 * @param {string} rid - 用户唯一标示
 * @param {string} token - 当前登陆用户的临时标示
 * @param {number} scorers - 分数
 * @param {func} callbackFunc - 回调函数
 */
Interactive.updateScorers = function(rid, token, scorers, callbackFunc, onerror) {
    var url = qc.interactive.serverUrl + "updateScorers03.php";
    url += "?rid=" + rid;
    url += "&token=" + token;
    url += "&scorers=" + scorers;
    url += "&gameName=" + qc.interactive.gameName;

    qc.AssetUtil.get(url, callbackFunc, onerror);
};

/**
 * 获取排行榜
 * @param {string} rid - 用户唯一标示
 * @param {string} token - 当前登陆用户的临时标示
 * @param {string} channel - 渠道
 * @param {func} callbackFunc - 回调函数
 */
Interactive.getRank = function(rid, token, channel, callbackFunc, onerror) {
    var url = qc.interactive.serverUrl + "getRank03.php";
    url += "?rid=" + rid;
    url += "&token=" + token;
    url += "&channel=" + channel;
    url += "&gameName=" + qc.interactive.gameName;

    qc.AssetUtil.get(url, callbackFunc, onerror);
};

var GameOver = qc.defineBehaviour('qc.Koala.ui.GameOver', qc.Behaviour, function() {
}, {
    // 重新开始游戏按钮
    restartBtn : qc.Serializer.NODE,
    // 分享按钮
    shareBtn : qc.Serializer.NODE,
    // 更逗游戏按钮
    moreBtn : qc.Serializer.NODE,
    // 排行榜按钮
    rankBtn : qc.Serializer.NODE,
    // 记录更新
    goalSign : qc.Serializer.NODE,
    // 当前分数文本
    scoreLabel : qc.Serializer.NODE,
    // 最高分文本
    bestLabel : qc.Serializer.NODE,
    // 世界排名百分比
    percentLabel : qc.Serializer.NODE
});

GameOver.prototype.awake = function() {
    // 监听游戏结束事件
    this.addListener(qc.Koala.onGameOver, this.show, this);

    // 监听重新开始游戏点击事件
    this.addListener(this.restartBtn.onClick, this.onRestartBtnClick, this);

    // 监听分享按钮点击事件
    this.addListener(this.shareBtn.onClick, function() {
        qc.Koala.showShareMsg.dispatch();
    }, this);

    // 监听更多游戏按钮点击事件
    this.addListener(this.moreBtn.onClick, function() {
        document.location.href = qc.Koala.logic.config.followHref;
    }, this);

    // 监听排行榜按钮点击事件
    this.addListener(this.rankBtn.onClick, this.onRankBtnClick, this);
};

/**
 * 初始化界面
 */
GameOver.prototype.initUI = function() {
    if (qc.Koala.logic.me.score === qc.Koala.logic.me.best) {
        this.goalSign.visible = true;

        // 判断当前分数是否超过历史最高分数
        qc.Interactive.updateScorers(
            qc.Koala.logic.me.rid,
            qc.Koala.logic.me.token,
            qc.Koala.logic.me.best,
            function(data) {
                // 更新分数成功
                console.log("更新分数成功");
            }
        );
    }
    else {
        this.goalSign.visible = false;
    }

    var score = qc.Koala.logic.me.score
    this.scoreLabel.text = score + '';

    this.bestLabel.text = '最高分：' + qc.Koala.logic.me.best;

    var percent = qc.Koala.logic.percent.getPercent(score);
    this.percentLabel.text = '你击败了全球' + percent + '%的玩家';
};

/**
 * 重新开始游戏按钮点击后处理
 */
GameOver.prototype.onRestartBtnClick = function() {
    // 派发游戏开始事件，并指定为重新开始
    qc.Koala.onStart.dispatch(true);
    // 隐藏死亡界面
    this.hide();
};

/**
 * 排行榜按钮点击后处理
 */
GameOver.prototype.onRankBtnClick = function () {
    if (qc.Koala.logic.me.userInfo &&
        qc.Koala.logic.me.userInfo.subscribe) {
        qc.Koala.onRankingClose.addOnce(this.show, this);

        qc.Koala.showRanking.dispatch();

        this.hide();
    }else{
        //显示关注界面
        qc.Koala.showFollowMsg.dispatch();
    }
};

/**
 * 显示界面
 */
GameOver.prototype.show = function () {
    this.initUI();
    this.gameObject.visible = true;
};

/**
 * 隐藏界面
 */
GameOver.prototype.hide = function () {
    this.gameObject.visible = false;
};

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

var Pause = qc.defineBehaviour('qc.Koala.ui.Pause', qc.Behaviour, function() {
}, {
    // 继续游戏按钮
    continueBtn : qc.Serializer.NODE,
    restartBtn : qc.Serializer.NODE,
    shareBtn : qc.Serializer.NODE,
    moreBtn : qc.Serializer.NODE,
    rankBtn : qc.Serializer.NODE
});

/**
 * 初始化
 */
Pause.prototype.awake = function() {
    var self =this;
    // 监听游戏暂停事件
    this.addListener(qc.Koala.onPause, this.show, this);

    // 监听继续游戏按钮点击事件
    this.addListener(this.continueBtn.onClick, this.onContinueBtnClick, this);

    // 监听重新开始游戏点击事件
    this.addListener(this.restartBtn.onClick, this.onRestartBtnClick, this);

    // 监听分享按钮点击事件
    this.addListener(this.shareBtn.onClick, function() {
        qc.Koala.showShareMsg.dispatch();
    }, this);

    // 监听更多游戏按钮点击事件
    this.addListener(this.moreBtn.onClick, function() {
        document.location.href = qc.Koala.logic.config.followHref;
    }, this);

    // 监听排行榜按钮点击事件
    this.addListener(this.rankBtn.onClick, this.onRankBtnClick, this);
};

/** 重新开始游戏按钮点击后处理 */
Pause.prototype.onRestartBtnClick = function() {
    // 派发游戏开始事件，并指定为重新开始
    qc.Koala.onStart.dispatch(true);
    // 隐藏死亡界面
    this.hide();
};

/**
 * 继续游戏按钮点击后处理
 */
Pause.prototype.onContinueBtnClick = function() {
    // 设置游戏暂停状态
    qc.Koala.logic.me.paused = false;

    // 派发继续游戏事件
    qc.Koala.onContinue.dispatch();

    // 隐藏界面
    this.hide();
};

/**
 * 排行榜按钮点击事件后处理
 */
Pause.prototype.onRankBtnClick = function () {
    if (qc.Koala.logic.me.userInfo &&
        qc.Koala.logic.me.userInfo.subscribe) {
        qc.Koala.onRankingClose.addOnce(this.show, this);

        qc.Koala.showRanking.dispatch();

        this.hide();
    }
    else {
        //显示关注界面
        qc.Koala.showFollowMsg.dispatch();
    }
};

/**
 * 显示界面
 */
Pause.prototype.show = function () {
    this.gameObject.visible = true;
};

/**
 * 隐藏界面
 */
Pause.prototype.hide = function () {
    this.gameObject.visible = false;
};

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


var RankData = qc.defineBehaviour('qc.Koala.ui.RankData', com.qici.extraUI.TableViewAdapter, function() {
    this.rankData = null;
}, {
});

// Awake is called when the script instance is being loaded.
RankData.prototype.awake = function() {

};

// Update is called every frame, if the behaviour is enabled.
RankData.prototype.update = function() {

};

/**
 * �ڵ㴦�ڲ��ɼ�ʱ�����սڵ㣬
 * @param  {qc.Node} cell - �ڵ�
 * @param  {number} col - ������
 * @param  {number} row - ������
 */
RankData.prototype.revokeCell = function(cell, col, row) {

};

/**
 * �ڵ㴦�ڿɼ�ʱ�������ڵ㣬
 * @param  {qc.Node} cell - �ڵ�
 * @param  {number} col - ������
 * @param  {number} row - ������
 */
RankData.prototype.createCell = function(cell, col, row) {
    if (this.rankData && this.rankData[row]) {
        var n = cell.getScript('qc.Koala.ui.RankingRow');
        n.init(this.rankData[row]);
    }
};

RankData.prototype.getTableSize = function() {
    return { x: 1, y: this.rankData ? this.rankData.length : 0 };
};

/**
 * ������Table�еĵ㷵�ض�Ӧ�ĵ�Ԫ��
 * @param  {number} x - x������
 * @param  {number} y - y������
 * @return {{x: number, y: number}}} ���ص����ڵĵ�Ԫ����Ϣ
 */
RankData.prototype.findCellWithPos = function(x, y) {
    return {
        x: Math.floor(x / 510),
        y: Math.floor(y / 141)
    };
};

/**
 * ��ȡ�ڵ�����ʾλ��
 */
RankData.prototype.getCellRect = function(col, row) {
    return new qc.Rectangle(col * 510, row * 141 + this.gameObject.getScript('com.qici.extraUI.TableView').extraTop, 510, 141);
    //return new qc.Rectangle(col * 561 + this.extraLeft, row * 141 + this.extraTop, 561, 141);
};
var Ranking = qc.defineBehaviour('qc.Koala.ui.Ranking', qc.Behaviour, function() {
    this._rankingData = [];

    this._iconKeyList = [];
}, {
    rankingList : qc.Serializer.NODE,
    rankingRowPrefab : qc.Serializer.PREFAB,
    ownRanking : qc.Serializer.NODE,
    waiting : qc.Serializer.NODE,
    closeBtn : qc.Serializer.NODE
});

Ranking.prototype.awake = function () {
    this.addListener(qc.Koala.showRanking, this.show, this);

    this.addListener(this.closeBtn.onClick, this.close, this);
};

Ranking.prototype.getRanking = function () {
    // TODO 获取排行榜数据，监听到获取成功，调用getRankingSuccess方法
    var self = this;
    var me = qc.Koala.logic.me;
    qc.Interactive.getRank(me.rid, me.token, me.channel, function(data) {
        data = JSON.parse(data);
        var rank = 0;
        var rankTop = data.rankTop;
        for (var i = 0; i < rankTop.length; i++) {
            var u = rankTop[i];
            if (u.rid === me.rid) {
                rank = i + 1;
            }
            u.ranking = i + 1;
        }
        data.selfRank = data.userData[0];
        if (data.selfRank)
            data.selfRank.ranking = rank;

        self.getRankingSuccess(data);
    });
};

Ranking.prototype.getRankingSuccess = function (data) {
    this.waiting.stop();
    this.waiting.visible = false;

	// 初始化排行榜列表
    var n = this.rankingList.getScript('qc.Koala.ui.RankData');
    n.rankData = data.rankTop;
    n.dispatchDataChange();


	// 初始化我的排名
	this.initOwnRanking(data.selfRank);
};

Ranking.prototype.initOwnRanking = function (row) {
    var s = this.ownRanking.getScript('qc.Koala.ui.RankingRow');
    s.init(row);

    this.ownRanking.visible = true;
};

Ranking.prototype.show = function () {
    this.gameObject.visible = true;

    this.waiting.visible = true;
    this.waiting.playAnimation('zhuan', null, true);

    this.getRanking();
};

Ranking.prototype.close = function () {
    this.gameObject.visible = false;
    this._rankingData.length = 0;

    this._iconKeyList.forEach(function(icon) {
		this.game.assets.unload(icon);
	}, this);

    this._iconKeyList.length = 0;

    //this.rankingList.content.removeChildren();

    qc.Koala.onRankingClose.dispatch();
};

var RankingRow = qc.defineBehaviour('qc.Koala.ui.RankingRow', qc.Behaviour, function() {

}, {
    rankingLabel : qc.Serializer.NODE,
    headIcon : qc.Serializer.NODE,
    nameLabel : qc.Serializer.NODE,
    score : qc.Serializer.NODE
});

// 1, 2, 3名对应的排名文本相关颜色
RankingRow.COLORMAP = {
    '1' : { color : new qc.Color('#F9FB02'), stroke : new qc.Color('#860001') },
    '2' : { color : new qc.Color('#C5C6C1'), stroke : new qc.Color('#3A3436') },
    '3' : { color : new qc.Color('#FEB266'), stroke : new qc.Color('#591B02') }
};

// 排行榜默认的排名文本相关颜色
RankingRow.DEFAULTCOLOR = { color : new qc.Color('#FFFFFF'), stroke : new qc.Color('#A00F0A') };

RankingRow.prototype.init = function(row) {
    // 获取用户数据，并设置用户名和分数
	this.nameLabel.text = row.name;
	this.score.text = row.scorers + '';

	// 加载图片资源
	var url = row.headurl;
    var headIcon = this.headIcon;
    if (url)
	    this.game.assets.loadTexture(row.rid, url, function(texture) {
	        headIcon.texture = texture;
	    });

	// 获取名次
	var ranking = row.ranking || '100+',
		rankLabel = ranking + '',
        color = RankingRow.DEFAULTCOLOR;

	// 1,2,3名分别设置不同的排名文本颜色
	if (ranking <= 3) {
        // 获取文本内容及文本相关颜色
        rankLabel = 'NO.' + ranking;
        color = RankingRow.COLORMAP[ranking];
	}
    else {
        // 设置排名文本字体大小
        this.rankingLabel.fontSize = 52;
    }

    // 设置排名文本颜色及描边颜色
    this.rankingLabel.color = color.color;
    this.rankingLabel.stroke = color.stroke;
    this.rankingLabel.strokeThickness = 3;

	// 设置名次文本
	this.rankingLabel.text = rankLabel;
};

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


}).call(this, this, Object);
