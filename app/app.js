module.exports = function (nw, win, window) {
	var fs = nw.require('fs');
	var styles = fs.readFileSync('app/bx-style.css', {
		encoding: 'utf-8'
	});
	var contentLoad = fs.readFileSync('app/contentLoad.js', {
		encoding: 'utf-8'
	});

	var clipboard = nw.Clipboard.get();

	var viewer = window.viewer;

	viewer.addEventListener('consolemessage', function (e) {
		if (e.message === 'BestApp:login') {

			// ждём перехода со страницы
			viewer.executeScript({
				code: `
					window.addEventListener('unload', function () {
						console.log('BestApp:loader_show');
					});
				`
			});
		}
		else if (e.message === 'BestApp:chat') {

			// добавление переопределяющих стилей
			viewer.insertCSS({
				code: styles
			});
			viewer.executeScript({
				code: `
					document.querySelector('#bx-desktop-placeholder').addEventListener('animationEnd', function () { console.log('BestApp:loader_hide'); }); setTimeout(function () { console.log('BestApp:loader_hide'); }, 1500);
				`
			});
		}
		else if (e.message.match(/BestApp:link/)) {
			var link = e.message.split(';');

			nw.Shell.openExternal(link[1]);
		}

		// активация окна при нажатии на уведомление
		else if (e.message === 'BestApp:notificationClick') {
			win.show();
		};
	});

	// срабатывает по загрузке фрейма
	viewer.addEventListener('contentload', function () {
		viewer.contextMenus.create({
			contexts: ['link'],
			id: 'link',
			title: 'Скопировать ссылку',
			onclick: function (info) {
				if (info.linkUrl) {
					clipboard.set(info.linkUrl);
				};
			}
		});

		viewer.contextMenus.create({
			contexts: ['selection'],
			id: 'toYandex',
			title: 'Искать «%s» в Яндексе',
			onclick: function (info) {
				if (info.selectionText) {
					nw.Shell.openExternal('https://yandex.ru/yandsearch?text='+ info.selectionText);
				};
			}
		});

		// не удалось вернуть пункт меню про переход по ссылке в тексте
		// нельзя получить выделенный текст до активации меню
		// ну ок, можно, вот только придётся активировать
		// и деактивировать пункт меню извне по нажатию правой кнопкой
		// при наличии выбранного текста
		// хз

		viewer.executeScript({
			code: contentLoad
		});
	});

	viewer.setAttribute('src', desktop_app_href);

	// делаем окно активным
	viewer.focus();
};
