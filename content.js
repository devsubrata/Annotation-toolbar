chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "toggleToolbar") {
        let toolbar = document.getElementById("custom-toolbar");
        if (toolbar) {
            toolbar.remove();
        } else {
            injectToolbar();
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
    injectCanvas(); // Call the function to inject the canvas on toolbar injection
}

function injectCanvas() {
    let canvas = document.createElement("canvas");
    canvas.id = "drawingCanvas";
    document.body.appendChild(canvas);

    const ctx = canvas.getContext("2d");
    let drawing = false;

    function setupCanvas() {
        canvas.width = document.documentElement.scrollWidth;
        canvas.height = document.documentElement.scrollHeight;
        canvas.style.position = "absolute";
        canvas.style.top = "0";
        canvas.style.left = "0";
        canvas.style.zIndex = "9999";
        canvas.style.pointerEvents = "auto";
        canvas.style.backgroundColor = "transparent";
    }

    setupCanvas();
    window.addEventListener("resize", setupCanvas);

    // Drawing functionality
    canvas.addEventListener("mousedown", (e) => {
        drawing = true;
        ctx.beginPath();
        ctx.moveTo(e.clientX + window.scrollX, e.clientY + window.scrollY);
    });

    canvas.addEventListener("mousemove", (e) => {
        if (drawing) {
            ctx.lineTo(e.clientX + window.scrollX, e.clientY + window.scrollY);
            ctx.stroke();
        }
    });

    canvas.addEventListener("mouseup", () => {
        drawing = false;
    });
    canvas.addEventListener("mouseleave", () => {
        drawing = false;
    });

    // Clear canvas button functionality
    document.getElementById("clear")?.addEventListener("click", () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    });

    // Save canvas functionality
    document.getElementById("save")?.addEventListener("click", () => {
        let dataUrl = canvas.toDataURL("image/png");
        let link = document.createElement("a");
        link.href = dataUrl;
        link.download = "drawing.png";
        link.click();
    });
}
