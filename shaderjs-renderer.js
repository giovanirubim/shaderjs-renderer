const delay = ms => new Promise(done => setTimeout(done, ms));
const defaultShader = (x, y) => {
	const r = Math.round(x*255);
	const g = Math.round(y*255);
	return `rgba(${r}, ${g}, 0, 1)`;
};

class ShaderjsRenderer {
	constructor({ canvas, interval = 100, shader = defaultShader }) {
		const ctx = canvas.getContext('2d');
		this.canvas = canvas;
		this.ctx = ctx;
		this.shader = shader;
		this.scale = 1;
		this.renderId = 0;
		this.centerX = 0.5;
		this.centerY = 0.5;
		this.interval = interval;
		this.bindCanvas();
	}
	getTransformConsts() {
		const { canvas, scale, centerX, centerY } = this;
		const { width, height } = canvas;
		const mul_x = 1/width/scale;
		const mul_y = 1/height/scale;
		const sum_x = centerX - width/2*mul_x;
		const sum_y = centerY - height/2*mul_y;
		return { mul_x, sum_x, mul_y, sum_y };
	}
	pixelToValue(x, y) {
		const { mul_x, sum_x, mul_y, sum_y } = this.getTransformConsts();
		return [ x*mul_x + sum_x, y*mul_y + sum_y ];
	}
	valueToPixel(x, y) {
		const { mul_x, sum_x, mul_y, sum_y } = this.getTransformConsts();
		return [ (x - sum_x)/mul_x, (y - sum_y)/mul_y ];
	}
	async render() {
		const renderId = ++this.renderId;
		const { canvas, ctx, shader, interval } = this;
		const { width, height } = canvas;
		const { mul_x, sum_x, mul_y, sum_y } = this.getTransformConsts();
		let sqr_size = 32;
		let last = Date.now();
		for (let y=0; y<height; y+=sqr_size) {
			for (let x=0; x<width; x+=sqr_size) {
				ctx.fillStyle = shader(x*mul_x + sum_x, y*mul_y + sum_y);
				ctx.fillRect(x, y, sqr_size, sqr_size);
				if (Date.now() - last >= interval) {
					await delay(0);
					if (this.renderId !== renderId) return this;
					last = Date.now();
				}
			}
		}
		while ((sqr_size >>= 1) >= 1) {
			const mul_i = mul_y*sqr_size;
			const mul_j = mul_x*sqr_size;
			const nrows = Math.ceil(height/sqr_size);
			const ncols = Math.ceil(width/sqr_size);
			for (let i=0; i<nrows; ++i) {
				for (let j=0; j<ncols; ++j) {
					if ((i & 1) || (j & 1)) {
						ctx.fillStyle = shader(j*mul_j + sum_x, i*mul_i + sum_y);
						ctx.fillRect(j*sqr_size, i*sqr_size, sqr_size, sqr_size);
						if (Date.now() - last >= interval) {
							await delay(0);
							if (this.renderId !== renderId) return this;
							last = Date.now();
						}
					}
				}
			}
		}
	}
	bindCanvas() {
		const { canvas } = this;
		let mouse = {};
		canvas.addEventListener('wheel', e => {
			const { scale, centerX, centerY } = this;
			const { width, height } = canvas;
			const dx = e.offsetX - width/2;
			const dy = e.offsetY - height/2;
			const factor = e.deltaY < 0 ? 1.4 : 1/1.4;
			this.scale *= factor;
			this.centerX += dx*(factor - 1)/width/this.scale;
			this.centerY += dy*(factor - 1)/height/this.scale;
			this.render();
		});
		canvas.addEventListener('mousemove', e => {
			if (e.button !== 0) return;
			if (!mouse.start) return;
		});
	}
}
