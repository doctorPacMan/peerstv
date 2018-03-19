"use strict";
if(!window.Windows) {
	window.HOST = '//'+window.location.host;
	document.addEventListener('DOMContentLoaded',function(){$App.initialize()});
}
else (function () {

	window.HOST = 'ms-appx://dev.peers.tv';

	var app = WinJS.Application,
		activation = Windows ? Windows.ApplicationModel.Activation : null;

	//To launch your view with a specific size you first need to change the default startup mode:
	//ApplicationView.PreferredLaunchWindowingMode = ApplicationViewWindowingMode.PreferredLaunchViewSize;
	//then specify the size:
	//ApplicationView.PreferredLaunchViewSize = new Size(800, 800);
	//Instead, to set the smallest size allowed for a view you can simply call the following method:
	//ApplicationView.GetForCurrentView().SetPreferredMinSize(new Size(600, 600));
	app.onactivated = function (args) {
		if (args.detail.kind === activation.ActivationKind.launch) {
			if (args.detail.previousExecutionState !== activation.ApplicationExecutionState.terminated) {
				// TODO: это приложение только что запущено. Инициализируйте здесь свое приложение.
				console.log('APP Initialize', $App.initialize());
			} else {
				// TODO: работа этого приложения была приостановлена и затем завершена.
				// Для удобства пользователей восстановите здесь состояние приложения, как будто приложение никогда не прекращало работу.
				// console.log('APP Restore', $App.restore());
			}
			args.setPromise(WinJS.UI.processAll());
		}
	};
	app.oncheckpoint = function (args) {
		// TODO: действие приложения будет приостановлено. Сохраните здесь все состояния, которые понадобятся после приостановки.
		// Вы можете использовать объект WinJS.Application.sessionState, который автоматически сохраняется и восстанавливается после приостановки.
		// Если вам нужно завершить асинхронную операцию до того, как действие приложения будет приостановлено, вызовите args.setPromise().
	};
	app.start();
})();