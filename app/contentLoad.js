
// если есть форма входа на сайт
if (document.querySelector('#login-popup')) {
	console.log('BestApp:login');
}

// перенаправление после авторизации
else if (location.href.match(/login=yes/)) {
	console.log('BestApp:logged');
}

// переход на страницу чата
else if (location.href.match(/desktop_app/)) {
	console.log('BestApp:chat');
}
else {
	console.log('BestApp:loader_hide');
};

// переход по ссылкам
document.addEventListener('click', onClick);

function onClick (e) {
	var elem = e.target.closest('a');

	if (elem) {
		if (elem.getAttribute('href') && !elem.getAttribute('href').match(/^#/)) {
			e.preventDefault();
			e.stopPropagation();

			console.log('BestApp:link;'+ elem.href);
		};
	};
};

var mutantObserver100 = debounce(function () {
	linkDetector();
}, 100);

// слежение за изменением разметки
(new window.MutationObserver(mutantObserver100)).observe(document.body, {
	childList: true,
	subtree: true
});

// добавление обработчиков ссылкам
function linkDetector (mutation) {
	[].forEach.call(document.querySelectorAll('a'), function (link) {
		link.removeEventListener('click', onClick);
		link.addEventListener('click', onClick);
	});
};

// вызов функций через интервал
function debounce (func, wait, immediate) {
	var timeout;
	return function() {
		var context = this, args = arguments;
		var later = function() {
			timeout = null;
			if (!immediate) func.apply(context, args);
		};
		var callNow = immediate && !timeout;
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
		if (callNow) func.apply(context, args);
	};
};

// у встраиваемых скриптов нет доступа к window и его свойствам напрямую
// поэтому получаем доступ к ним через ДОМ
// https://github.com/nwjs/nw.js/issues/4008
// http://stackoverflow.com/questions/26851116/chrome-apps-webview-executescript-access-guest-global-varibles
var script = document.createElement('script');

script.textContent = `

	// https://github.com/electron/electron/issues/3575#issuecomment-162036189
	// https://github.com/sindresorhus/caprine/blob/8106f5060b259833111a6b7c69ed761a39f7408a/browser.js#L23-L36
	// Extend and replace the native notifications.
	var NativeNotification = Notification;

	Notification = function (title, options) {
		var notification = new NativeNotification(title, options);
		notification.addEventListener('click', function () {
			console.log('BestApp:notificationClick');
		});

		return notification;
	};
	Notification.prototype = NativeNotification.prototype;
	Notification.permission = NativeNotification.permission;
	Notification.requestPermission = NativeNotification.requestPermission.bind(Notification);
`;
(document.head||document.documentElement).appendChild(script);
script.remove();
