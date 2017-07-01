
lychee.define('harvester.Watcher').requires([
	'harvester.data.Filesystem',
	'harvester.data.Project',
	'harvester.mod.Beautifier',
	'harvester.mod.Fertilizer',
	'harvester.mod.Harvester',
	'harvester.mod.Packager',
	'harvester.mod.Server',
	'harvester.mod.Strainer'
]).exports(function(lychee, global, attachments) {

	const _Filesystem = lychee.import('harvester.data.Filesystem');
	const _Project    = lychee.import('harvester.data.Project');
	const _mod        = {
		Beautifier: lychee.import('harvester.mod.Beautifier'),
		Fertilizer: lychee.import('harvester.mod.Fertilizer'),
		Harvester:  lychee.import('harvester.mod.Harvester'),
		Packager:   lychee.import('harvester.mod.Packager'),
		Server:     lychee.import('harvester.mod.Server'),
		Strainer:   lychee.import('harvester.mod.Strainer')
	};



	/*
	 * HELPERS
	 */

	const _update_cache = function(silent) {

		silent = silent === true;


		// Libraries
		let libraries = this.filesystem.dir('/libraries').filter(function(value) {
			return /README\.md/.test(value) === false;
		}).map(function(value) {
			return '/libraries/' + value;
		});

		// Remove Libraries
		Object.keys(this.libraries).forEach(function(identifier) {

			let index = libraries.indexOf(identifier);
			if (index === -1) {

				if (silent === false) {
					console.log('harvester.Watcher: Remove Library "' + identifier + '"');
				}

				let server = this.libraries[identifier].server || null;
				if (server !== null) {
					server.destroy();
				}

				delete this.libraries[identifier];

			}

		}.bind(this));

		// Add Libraries
		libraries.forEach(function(identifier) {

			let check = this.libraries[identifier] || null;
			let info1 = this.filesystem.info(identifier + '/lychee.pkg');

			if (check === null && (info1 !== null && info1.type === 'file')) {

				if (silent === false) {
					console.log('harvester.Watcher: Add Library "' + identifier + '"');
				}

				this.libraries[identifier] = new _Project({
					identifier: identifier
				});

			}

		}.bind(this));



		// Projects
		let projects = this.filesystem.dir('/projects').filter(function(value) {
			return value !== 'README.md';
		}).map(function(value) {
			return '/projects/' + value;
		});


		// Remove Projects
		Object.keys(this.projects).forEach(function(identifier) {

			let index = projects.indexOf(identifier);
			if (index === -1) {

				if (silent === false) {
					console.log('harvester.Watcher: Remove Project "' + identifier + '"');
				}

				let server = this.projects[identifier].server || null;
				if (server !== null) {
					server.destroy();
				}

				delete this.projects[identifier];

			}

		}.bind(this));

		// Add Projects
		projects.forEach(function(identifier) {

			let check = this.projects[identifier] || null;
			let info1 = this.filesystem.info(identifier + '/index.html');
			let info2 = this.filesystem.info(identifier + '/lychee.pkg');

			if (check === null && ((info1 !== null && info1.type === 'file') || (info2 !== null && info2.type === 'file'))) {

				if (silent === false) {
					console.log('harvester.Watcher: Add Project "' + identifier + '"');
				}

				this.projects[identifier] = new _Project({
					identifier: identifier
				});

			}

		}.bind(this));

	};

	const _update_mods = function() {

		// XXX: Fertilizer disabled for performance reasons
		// let Fertilizer = _mod.Fertilizer;
		let Fertilizer = null;
		let Harvester  = _mod.Harvester;
		let Packager   = _mod.Packager;
		let Server     = _mod.Server;
		let Strainer   = _mod.Strainer;


		for (let lid in this.libraries) {

			let library = this.libraries[lid];
			let reasons = [];

			if (Packager !== null && Packager.can(library) === true) {
				reasons = Packager.process(library);
			}

			if (Server !== null && Server.can(library) === true) {
				Server.process(library);
			}


			if (reasons.length > 0) {

				let changed_api = reasons.find(function(path) {
					return path.startsWith('/api/files');
				}) || null;

				let changed_source = reasons.find(function(path) {
					return path.startsWith('/source/files');
				}) || null;

				if (changed_api !== null && Harvester !== null && Harvester.can(library) === true) {
					Harvester.process(library);
				}

				if (changed_source !== null && Strainer !== null && Strainer.can(library) === true) {
					Strainer.process(library);
				}

				if (changed_source !== null && Fertilizer !== null && Fertilizer.can(library) === true) {
					Fertilizer.process(library);
				}

			}

		}

		for (let pid in this.projects) {

			let project = this.projects[pid];
			let reasons = [];

			if (Packager !== null && Packager.can(project) === true) {
				reasons = Packager.process(project);
			}

			if (Server !== null && Server.can(project) === true) {
				Server.process(project);
			}


			if (reasons.length > 0) {

				let changed_api = reasons.find(function(path) {
					return path.startsWith('/api/files');
				}) || null;

				let changed_source = reasons.find(function(path) {
					return path.startsWith('/source/files');
				}) || null;

				if (changed_api !== null && Harvester !== null && Harvester.can(project) === true) {
					Harvester.process(project);
				}

				if (changed_source !== null && Strainer !== null && Strainer.can(project) === true) {
					Strainer.process(project);
				}

				if (changed_source !== null && Fertilizer !== null && Fertilizer.can(project) === true) {
					Fertilizer.process(project);
				}

			}

		}

	};



	/*
	 * IMPLEMENTATION
	 */

	let Composite = function(main) {

		this.filesystem = new _Filesystem();
		this.libraries  = {};
		this.projects   = {};


		// Figure out if there's a cleaner way
		main._libraries = this.libraries;
		main._projects  = this.projects;

	};

	Composite.prototype = {

		/*
		 * ENTITY API
		 */

		// deserialize: function(blob) {},

		serialize: function() {

			return {
				'constructor': 'harvester.Watcher',
				'arguments':   []
			};

		},

		init: function() {

			// XXX: Don't flood log on initialization
			_update_cache.call(this, true);


			let can_update = true;

			for (let lid in this.libraries) {

				if (_mod.Harvester !== null && _mod.Harvester.can(this.libraries[lid]) === false) {
					can_update = false;
				}

			}

			for (let pid in this.projects) {

				if (_mod.Harvester !== null && _mod.Harvester.can(this.projects[pid]) === false) {
					can_update = false;
				}

			}


			if (can_update === true) {

				console.info('harvester.Watcher: Software Bot Assimilation enabled');
				console.log('\n');

			} else {

				console.log('\n');
				console.warn('harvester.Watcher: Software Bot Assimilation disabled');
				console.warn('                   Please pull from "upstream" manually.');
				console.log('\n');

			}


			for (let lid in this.libraries) {

				let library = this.libraries[lid];

				if (_mod.Packager !== null && _mod.Packager.can(library) === true) {
					_mod.Packager.process(library);
				}

				if (_mod.Beautifier !== null && _mod.Beautifier.can(library) === true) {
					_mod.Beautifier.process(library);
				}

				if (_mod.Server !== null && _mod.Server.can(library) === true) {
					_mod.Server.process(library);
				}

				if (_mod.Strainer !== null && _mod.Strainer.can(library) === true) {
					_mod.Strainer.process(library);
				}

			}

			for (let pid in this.projects) {

				let project = this.projects[pid];

				if (_mod.Packager !== null && _mod.Packager.can(project) === true) {
					_mod.Packager.process(project);
				}

				if (_mod.Beautifier !== null && _mod.Beautifier.can(project) === true) {
					_mod.Beautifier.process(project);
				}

				if (_mod.Server !== null && _mod.Server.can(project) === true) {
					_mod.Server.process(project);
				}

				if (_mod.Strainer !== null && _mod.Strainer.can(project) === true) {
					_mod.Strainer.process(project);
				}

			}


			return true;

		},

		update: function() {

			_update_cache.call(this);
			_update_mods.call(this);

		}

	};


	return Composite;

});

