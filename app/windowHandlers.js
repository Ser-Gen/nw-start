module.exports = function (nw, win, window) {

	window._ = window._ || {};

	// сохраняем состояние окна
	window._.saveWindowState = nw.require('./winstate.js')(nw, win, window);

	// отображение самого окна
	win.show();

	// обработчики фокуса окна
	window._.isFocused = false;

	win.on('focus', function () {
		window._.isFocused = true;
		win.requestAttention(false);
	});
	win.on('blur', function () {
		window._.isFocused = false;
	});

	// показываем пиктограмму в трее
	window._.trayIcon = {
		default: './app/img/tray.png',
		received: './app/img/tray_received.png'
	};

	window._.tray = new nw.Tray({
		icon: window._.trayIcon.default
	});

	var trayMenu = new nw.Menu();

	trayMenu.append(new nw.MenuItem({
		label: 'Выйти'
	}));
	trayMenu.items[0].click = function () {
		window._.saveWindowState();
		win.close(true);
	};
	window._.tray.menu = trayMenu;

	// отображение программы, свёрнутой в трей
	window._.tray.on('click', function () {
		win.show();
	});

	// отображение программы при вызове ярлыком
	nw.App.on('open', function () {
		win.show();
	});

	// скрытие окна приложения
	win.on('close', function(){
		window._.saveWindowState();
		win.hide();
	});

	// ссылки наружу должны открываться в стандартном браузере
	win.on('new-win-policy', onNewWindow);
	win.on('navigation', onNewWindow);

	function onNewWindow (frame, url, policy) {
		policy.ignore();
		nw.Shell.openExternal(url);
	};
};
