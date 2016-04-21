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
