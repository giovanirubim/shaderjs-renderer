const canvas = document.createElement('canvas');
canvas.width = 600;
canvas.height = 600;

window.onload = () => {
	document.body.appendChild(canvas);
	new ShaderjsRenderer({ canvas }).render();
};
