
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
 * ��ȡ�ڵ����ʾλ��
 */
RankData.prototype.getCellRect = function(col, row) {
    return new qc.Rectangle(col * 510, row * 141 + this.gameObject.getScript('com.qici.extraUI.TableView').extraTop, 510, 141);
    //return new qc.Rectangle(col * 561 + this.extraLeft, row * 141 + this.extraTop, 561, 141);
};