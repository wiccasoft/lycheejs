
lychee.define('strainer.Fixer').requires([
	'lychee.Input',
	'strainer.flow.Check'
]).includes([
	'lychee.event.Emitter'
]).exports(function(lychee, global, attachments) {

	const _lychee  = lychee.import('lychee');
	const _Emitter = lychee.import('lychee.event.Emitter');
	const _Input   = lychee.import('lychee.Input');
	const _flow    = lychee.import('strainer.flow');



	/*
	 * IMPLEMENTATION
	 */

	let Composite = function(settings) {

		this.settings = _lychee.assignunlink({
			cwd:     lychee.ROOT.lychee,
			file:    null,
			project: null
		}, settings);

		this.defaults = _lychee.assignunlink({
			cwd:     lychee.ROOT.lychee,
			file:    null,
			project: null
		}, this.settings);


		_Emitter.call(this);



		/*
		 * INITIALIZATION
		 */

		this.bind('load', function() {

			let file    = this.settings.file    || null;
			let project = this.settings.project || null;

			if (file !== null && project !== null) {

				lychee.ROOT.project                           = _lychee.ROOT.lychee + project;
				lychee.environment.global.lychee.ROOT.project = _lychee.ROOT.lychee + project;


				this.trigger('init');

			} else {

				this.destroy(1);

			}

		}, this, true);

		this.bind('init', function() {

			let flow = new _flow.Check({
				sandbox:  this.settings.project,
				settings: this.settings
			});


			flow.unbind('read');
			flow.bind('read', function(oncomplete) {

				let file    = this.settings.file;
				let project = this.settings.project;
				let sandbox = this.sandbox;
				let stash   = this.stash;

				if (sandbox !== '' && stash !== null) {

					console.log('strainer: READ ' + project);


					let that  = this;
					let asset = new Stuff(sandbox + '/' + file, true);
					let pkg   = new Config(sandbox + '/lychee.pkg');


					pkg.onload = function(result) {

						if (result === true) {

							asset.onload = function(result) {

								if (result === true) {

									that.codes = [ asset ];
									oncomplete(true);

								} else {

									oncomplete(false);

								}

							};

							asset.load();

						} else {

							oncomplete(false);

						}

					};

					pkg.load();

				} else {

					oncomplete(false);

				}


			}, flow);

			flow.bind('complete', function() {

				let cwd = this.settings.cwd;


				let length = flow.errors.length;
				if (length === 0) {

					console.error('\n0 problems');

					this.destroy(0);

				} else {

					flow.errors.forEach(function(err) {

						let path = '/opt/lycheejs' + err.url;
						let rule = err.rule    || 'parser-error';
						let line = err.line    || 0;
						let col  = err.column  || 0;
						let msg  = err.message || 'Parsing error: unknown';
						if (msg.endsWith('.') === false) {
							msg = msg.trim() + '.';
						}


						let message = '';

						message += path.substr(cwd.length + 1);
						message += ':' + line;
						message += ':' + col;
						message += ': ' + msg;
						message += ' [' + rule + ']';

						console.error(message);

					});

					console.error('\n' + length + ' ' + (length === 1 ? 'problem' : 'problems'));

					this.destroy(1);

				}

			}, this);

			flow.bind('error', function(event) {

				this.destroy(1);

			}, this);


			flow.init();


			return true;

		}, this, true);

	};


	Composite.prototype = {

		/*
		 * ENTITY API
		 */

		// deserialize: function(blob) {},

		serialize: function() {

			let data = _Emitter.prototype.serialize.call(this);
			data['constructor'] = 'strainer.Fixer';


			let settings = _lychee.assignunlink({}, this.settings);
			let blob     = data['blob'] || {};


			data['arguments'][0] = settings;
			data['blob']         = Object.keys(blob).length > 0 ? blob : null;


			return data;

		},



		/*
		 * MAIN API
		 */

		init: function() {

			this.trigger('load');

			return true;

		},

		destroy: function(code) {

			code = typeof code === 'number' ? code : 0;


			this.trigger('destroy', [ code ]);

			return true;

		}

	};


	return Composite;

});

