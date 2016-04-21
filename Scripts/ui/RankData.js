
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
 * 节点处于不可见时，回收节点，
 * @param  {qc.Node} cell - 节点
 * @param  {number} col - 所在列
 * @param  {number} row - 所在行
 */
RankData.prototype.revokeCell = function(cell, col, row) {

};

/**
 * 节点处于可见时，创建节点，
 * @param  {qc.Node} cell - 节点
 * @param  {number} col - 所在列
 * @param  {number} row - 所在行
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
 * 根据在Table中的点返回对应的单元格
 * @param  {number} x - x轴坐标
 * @param  {number} y - y轴坐标
 * @return {{x: number, y: number}}} 返回点所在的单元格信息
 */
RankData.prototype.findCellWithPos = function(x, y) {
    return {
        x: Math.floor(x / 510),
        y: Math.floor(y / 141)
    };
};

/**
 * 获取节点的显示位置
 */
RankData.prototype.getCellRect = function(col, row) {
    return new qc.Rectangle(col * 510, row * 141 + this.gameObject.getScript('com.qici.extraUI.TableView').extraTop, 510, 141);
    //return new qc.Rectangle(col * 561 + this.extraLeft, row * 141 + this.extraTop, 561, 141);
};