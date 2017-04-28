window.onerror = function (e) {
	console.log(e);
};

process.on('uncaughtException' ,function (e) {
	console.error('uncaughtException:', e);
	console.error(e.stack);
});

var win = nw.Window.get();

// навешиваем обработчики на элементы окна
require('./windowHandlers.js')(nw, win, window);

// стартуем приложение
require('./app.js')(nw, win, window);
