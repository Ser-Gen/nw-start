module.exports = winState;

function winState (nw) {
	'use strict'
	/**
	 * https://github.com/nwjs/nw.js/wiki/Preserve-window-state-between-sessions
	 *
	 * Cross-platform window state preservation.
	 * Yes this code is quite complicated, but this is the best I came up with for
	 * current state of node-webkit Window API (v0.7.3 and later).
	 *
	 * Known issues:
	 * - Unmaximization not always sets the window (x, y) in the lastly used coordinates.
	 * - Unmaximization animation sometimes looks wierd.
	 * - Extra height added to window, at least in linux x64 gnome-shell env. It seems that
	 *   when we read height then it returns it with window frame, but if we resize window
	 *   then it applies dimensions only to internal document without external frame.
	 *   Need to test in other environments with different visual themes.
	 *
	 * Change log:
	 * 2013-12-01
	 * - Workaround of extra height in gnome-shell added.
	 *
	 * 2014-03-22
	 * - Repared workaround (from 2013-12-01) behaviour when use frameless window.
	 *   Now it works correctly.
	 * 2014-10-02
	 * - Fixed cannot set windowState of null error when attempting to set localStorage
	 *
	 * 2015-03-05
	 * - Don't call window.show() if dev tools are already open (see initWindowState).
	 *
	 * 2015-06-15
	 * - Don't resize the window when using LiveReload.
	 */

	var gui = nw;
	var win = gui.Window.get();
	var winState;
	var currWinMode;
	var resizeTimeout;
	var isMaximizationEvent = false;
	// extra height added in linux x64 gnome-shell env, use it as workaround
	var deltaHeight = gui.App.manifest.window.frame ? 0 : 'disabled';


	function initWindowState() {
		winState = JSON.parse(localStorage.windowState || 'null');

		if (winState) {
			currWinMode = winState.mode;
			if (currWinMode === 'maximized') {
				win.maximize();
			} else {
				restoreWindowState();
			}
		} else {
			currWinMode = 'normal';
			dumpWindowState();
		}

		win.show();
	}

	function dumpWindowState() {
		if (!winState) {
			winState = {};
		}

		// we don't want to save minimized state, only maximized or normal
		if (currWinMode === 'maximized') {
			winState.mode = 'maximized';
		} else {
			winState.mode = 'normal';
		}

		// when window is maximized you want to preserve normal
		// window dimensions to restore them later (even between sessions)
		if (currWinMode === 'normal') {
			winState.x = win.x;
			winState.y = win.y;
			winState.width = win.width;
			winState.height = win.height;

			// save delta only of it is not zero
			if (deltaHeight !== 'disabled' && deltaHeight !== 0 && currWinMode !== 'maximized') {
				winState.deltaHeight = deltaHeight;
			}
		}
	}

	function restoreWindowState() {
		// deltaHeight already saved, so just restore it and adjust window height
		if (deltaHeight !== 'disabled' && typeof winState.deltaHeight !== 'undefined') {
			deltaHeight = winState.deltaHeight
			winState.height = winState.height - deltaHeight
		};

		// иногда окно задвигается за пределы экрана
		// нормализация предотвращает это
		normalizeWindowState();

		win.resizeTo(winState.width, winState.height);
		win.moveTo(winState.x, winState.y);
	}

	function normalizeWindowState () {
		gui.Screen.Init();

		var screens = gui.Screen.screens;
		var x = {
			min: 0
		};
		var y = {
			min: 0
		};
		var triggered = false;

		screens.forEach(function (screen) {
			if (x.min > screen.work_area.x) {
				x.min = screen.work_area.x;
			};
			if (x.max < screen.work_area.x + screen.work_area.width) {
				x.max = screen.work_area.x + screen.work_area.width;
			};
			if (y.min > screen.work_area.y) {
				y.min = screen.work_area.y;
			};
			if (y.max < screen.work_area.y + screen.work_area.height) {
				y.max = screen.work_area.y + screen.work_area.height;
			};
		});

		if (winState.x < x.min) {
			winState.x = 0;
			triggered = true;
		};
		if (x.max && winState.x > x.max) {
			winState.x = x.max - winState.width;
			triggered = true;
		};
		if (winState.y < y.min) {
			winState.y = 0;
			triggered = true;
		};
		if (y.max && winState.y > y.max) {
			winState.y = y.max - winState.height;
			triggered = true;
		};

		if (triggered) {
			localStorage['windowState'] = JSON.stringify(winState);
		};
	}

	function saveWindowState() {
		dumpWindowState();
		localStorage['windowState'] = JSON.stringify(winState);
	}

	initWindowState();

	win.on('maximize', function () {
		isMaximizationEvent = true;
		currWinMode = 'maximized';
	});

	win.on('unmaximize', function () {
		currWinMode = 'normal';
		restoreWindowState();
	});

	win.on('minimize', function () {
		currWinMode = 'minimized';
	});

	win.on('restore', function () {
		currWinMode = 'normal';
	});

	win.window.addEventListener('resize', function () {
		// resize event is fired many times on one resize action,
		// this hack with setTiemout forces it to fire only once
		clearTimeout(resizeTimeout);
		resizeTimeout = setTimeout(function () {

			// on MacOS you can resize maximized window, so it's no longer maximized
			if (isMaximizationEvent) {
				// first resize after maximization event should be ignored
				isMaximizationEvent = false;
			} else {
				if (currWinMode === 'maximized') {
					currWinMode = 'normal';
				}
			}

			// there is no deltaHeight yet, calculate it and adjust window size
			if (deltaHeight !== 'disabled' && deltaHeight === false) {
				deltaHeight = win.height - winState.height;

				// set correct size
				if (deltaHeight !== 0) {
					win.resizeTo(winState.width, win.height - deltaHeight);
				}
			}

			dumpWindowState();

		}, 500);
	}, false);

	win.on('close', function () {
		try {
			saveWindowState();
		} catch(err) {
			console.log("winstateError: " + err);
		}
	});

	return saveWindowState;
};
