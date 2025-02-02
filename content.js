chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "toggleToolbar") {
        let toolbar = document.getElementById("custom-toolbar");
        let canvas = document.getElementById("drawingCanvas");

        if (toolbar) {
            toolbar.remove();
            if (canvas) canvas.remove();
        } else {
            injectToolbar();
            injectCanvas();
        }
    }
});

function injectToolbar() {
    let toolbar = document.createElement("div");
    toolbar.id = "custom-toolbar";
    toolbar.innerHTML = `
        <button id="brush" class="active">Brush</button>
        <button id="horizontalLine" title="Horizontal line">==</button>
        <button id="verticalLine" title="Vertical line">||</button>

        <button id="rectangle" title="Rectangle">▭</button>
        <button id="filledRectangle" title="Filled rectangle">▆</button>

        <button id="circle" title="Circle">🔘</button>
        <button id="filledCircle" title="Filled circle">⚫</button>

        <input type="color" id="colorPicker" />

        <div class="range_div">
            <label for="opacity">Size</label>
            <input type="range" id="brushSize" min="1" max="50" value="1" />
            <span id="rangeValue">01</span>
        </div>

        <button id="eraser">Eraser</button>
        <button id="clear">Clear</button>
        <button id="save">Save</button>

        <div class="range_div">
            <label for="opacity">Opacity</label>
            <input type="range" id="opacity" min="0" max="1" step="0.01" value="1" />
            <span id="opacityValue">1.0</span>
        </div>
    `;

    document.body.prepend(toolbar);
    addToolbarEvents();
}

function injectCanvas() {
    let canvas = document.createElement("canvas");
    canvas.id = "drawingCanvas";
    canvas.style.position = "fixed";
    canvas.style.top = "0";
    canvas.style.left = "0";
    canvas.style.width = "100vw";
    canvas.style.height = "100vh";
    canvas.style.zIndex = "9999";
    canvas.style.pointerEvents = "auto"; // ✅ Allows interaction with canvas
    document.body.appendChild(canvas);

    let ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    addCanvasEvents(canvas, ctx);
}

function addCanvasEvents(canvas, ctx) {
    let drawing = false;
    let tool = "brush";
    let color = "#000000";
    let size = 1;
    let opacity = 1.0;

    function startDraw(e) {
        drawing = true;
        ctx.beginPath();
        ctx.moveTo(e.clientX, e.clientY);
    }

    function draw(e) {
        if (!drawing) return;
        ctx.strokeStyle = color;
        ctx.lineWidth = size;
        ctx.globalAlpha = opacity;
        ctx.lineCap = "round";

        if (tool === "brush") {
            ctx.lineTo(e.clientX, e.clientY);
            ctx.stroke();
        }
    }

    function stopDraw() {
        drawing = false;
        ctx.beginPath();
    }

    canvas.addEventListener("mousedown", startDraw);
    canvas.addEventListener("mousemove", draw);
    canvas.addEventListener("mouseup", stopDraw);
    canvas.addEventListener("mouseleave", stopDraw);

    // Toolbar event listeners
    document.getElementById("brush").addEventListener("click", () => (tool = "brush"));
    document.getElementById("eraser").addEventListener("click", () => {
        tool = "brush";
        color = "#FFFFFF";
    });
    document
        .getElementById("colorPicker")
        .addEventListener("input", (e) => (color = e.target.value));
    document.getElementById("brushSize").addEventListener("input", (e) => (size = e.target.value));
    document.getElementById("opacity").addEventListener("input", (e) => (opacity = e.target.value));

    document.getElementById("clear").addEventListener("click", () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    });

    document.getElementById("save").addEventListener("click", () => {
        let link = document.createElement("a");
        link.download = "drawing.png";
        link.href = canvas.toDataURL();
        link.click();
    });
}

function addToolbarEvents() {
    document.getElementById("brushSize").addEventListener("input", function () {
        document.getElementById("rangeValue").innerText = this.value;
    });

    document.getElementById("opacity").addEventListener("input", function () {
        document.getElementById("opacityValue").innerText = this.value;
    });
}
