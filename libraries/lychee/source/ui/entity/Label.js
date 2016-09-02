
lychee.define('lychee.ui.entity.Label').includes([
	'lychee.ui.Entity'
]).exports(function(lychee, global, attachments) {

	const _Entity = lychee.import('lychee.ui.Entity');
	const _FONT   = attachments["fnt"];



	/*
	 * IMPLEMENTATION
	 */

	let Composite = function(data) {

		let settings = Object.assign({}, data);


		this.font  = _FONT;
		this.value = '';


		this.setFont(settings.font);
		this.setValue(settings.value);

		delete settings.font;
		delete settings.value;


		settings.width  = typeof settings.width === 'number'  ? settings.width  : this.width;
		settings.height = typeof settings.height === 'number' ? settings.height : this.height;
		settings.shape  = _Entity.SHAPE.rectangle;


		_Entity.call(this, settings);

		settings = null;

	};


	Composite.prototype = {

		/*
		 * ENTITY API
		 */

		deserialize: function(blob) {

			let font = lychee.deserialize(blob.font);
			if (font !== null) {
				this.setFont(font);
			}

		},

		serialize: function() {

			let data = _Entity.prototype.serialize.call(this);
			data['constructor'] = 'lychee.ui.entity.Label';

			let settings = data['arguments'][0];
			let blob     = (data['blob'] || {});


			if (this.value !== '') settings.value = this.value;


			if (this.font !== null) blob.font = lychee.serialize(this.font);


			data['blob'] = Object.keys(blob).length > 0 ? blob : null;


			return data;

		},

		render: function(renderer, offsetX, offsetY) {

			if (this.visible === false) return;


			let alpha    = this.alpha;
			let position = this.position;

			let x = position.x + offsetX;
			let y = position.y + offsetY;


			let font  = this.font;
			let value = this.value;


			if (alpha !== 1) {
				renderer.setAlpha(alpha);
			}


			if (font !== null) {

				let cur = font.measure(value);
				let max = this.width;

				if (cur.realwidth <= max) {

					renderer.drawText(
						x,
						y,
						value,
						font,
						true
					);

				} else {

					let len = (max / cur.realwidth * value.length) | 0;
					let str = value.substr(0, len);

					renderer.drawText(
						x,
						y,
						str,
						font,
						true
					);

				}

			}


			if (alpha !== 1) {
				renderer.setAlpha(1.0);
			}

		},



		/*
		 * CUSTOM API
		 */

		setFont: function(font) {

			font = font instanceof Font ? font : null;


			if (font !== null) {

				this.font = font;

				// refresh the layout
				if (this.value !== '') {
					this.setValue(this.value);
				}

				return true;

			}


			return false;

		},

		setValue: function(value) {

			value = typeof value === 'string' ? value : null;


			if (value !== null) {

				let font = this.font;
				if (font !== null) {

					let dim = font.measure(value);

					this.width  = dim.realwidth;
					this.height = dim.realheight;

				}


				this.value = value;

				return true;

			}


			return false;

		}

	};


	return Composite;

});
