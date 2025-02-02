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

    // Add the canvas to overlay the webpage
    let canvas = document.createElement("canvas");
    canvas.id = "drawingCanvas";
    document.body.appendChild(canvas);

    // Set up canvas size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Apply styles
    canvas.style.position = "fixed";
    canvas.style.top = "0";
    canvas.style.left = "0";
    canvas.style.width = "100vw";
    canvas.style.height = "100vh";
    canvas.style.pointerEvents = "none";
    canvas.style.zIndex = "9999"; // Ensure it stays on top
    canvas.style.backgroundColor = "transparent";

    // Enable Drawing Functions
    enableDrawing();
}

function enableDrawing() {
    const canvas = document.getElementById("drawingCanvas");
    const ctx = canvas.getContext("2d");

    let drawing = false;
    let tool = "brush"; // Default tool
    let startX, startY; // Used for lines & shapes

    // Set default styles
    ctx.strokeStyle = "#000000"; // Default color
    ctx.lineWidth = 2;
    ctx.globalAlpha = 1;

    // Handle mouse events
    canvas.addEventListener("mousedown", (e) => {
        drawing = true;
        startX = e.clientX;
        startY = e.clientY;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
    });

    canvas.addEventListener("mousemove", (e) => {
        if (!drawing) return;

        if (tool === "brush") {
            ctx.lineTo(e.clientX, e.clientY);
            ctx.stroke();
        }
    });

    canvas.addEventListener("mouseup", (e) => {
        drawing = false;

        if (tool === "horizontalLine") {
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(e.clientX, startY);
            ctx.stroke();
        } else if (tool === "verticalLine") {
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(startX, e.clientY);
            ctx.stroke();
        } else if (tool === "rectangle") {
            ctx.strokeRect(startX, startY, e.clientX - startX, e.clientY - startY);
        } else if (tool === "filledRectangle") {
            ctx.fillStyle = ctx.strokeStyle;
            ctx.fillRect(startX, startY, e.clientX - startX, e.clientY - startY);
        } else if (tool === "circle") {
            let radius = Math.sqrt(
                Math.pow(e.clientX - startX, 2) + Math.pow(e.clientY - startY, 2)
            );
            ctx.beginPath();
            ctx.arc(startX, startY, radius, 0, Math.PI * 2);
            ctx.stroke();
        } else if (tool === "filledCircle") {
            let radius = Math.sqrt(
                Math.pow(e.clientX - startX, 2) + Math.pow(e.clientY - startY, 2)
            );
            ctx.fillStyle = ctx.strokeStyle;
            ctx.beginPath();
            ctx.arc(startX, startY, radius, 0, Math.PI * 2);
            ctx.fill();
        }
    });

    // Change Tool Selection
    document.getElementById("brush").addEventListener("click", () => (tool = "brush"));
    document
        .getElementById("horizontalLine")
        .addEventListener("click", () => (tool = "horizontalLine"));
    document
        .getElementById("verticalLine")
        .addEventListener("click", () => (tool = "verticalLine"));
    document.getElementById("rectangle").addEventListener("click", () => (tool = "rectangle"));
    document
        .getElementById("filledRectangle")
        .addEventListener("click", () => (tool = "filledRectangle"));
    document.getElementById("circle").addEventListener("click", () => (tool = "circle"));
    document
        .getElementById("filledCircle")
        .addEventListener("click", () => (tool = "filledCircle"));

    // Eraser
    document.getElementById("eraser").addEventListener("click", () => {
        tool = "brush";
        ctx.strokeStyle = "white";
        ctx.globalAlpha = 1;
        ctx.lineWidth = 10;
    });

    // Clear Canvas
    document.getElementById("clear").addEventListener("click", () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    });

    // Save Canvas
    document.getElementById("save").addEventListener("click", () => {
        let link = document.createElement("a");
        link.download = "drawing.png";
        link.href = canvas.toDataURL();
        link.click();
    });

    // Change Brush Color
    document.getElementById("colorPicker").addEventListener("input", (e) => {
        ctx.strokeStyle = e.target.value;
        ctx.fillStyle = e.target.value;
    });

    // Change Brush Size
    document.getElementById("brushSize").addEventListener("input", (e) => {
        ctx.lineWidth = e.target.value;
        document.getElementById("rangeValue").innerText = e.target.value;
    });

    // Change Opacity
    document.getElementById("opacity").addEventListener("input", (e) => {
        ctx.globalAlpha = e.target.value;
        document.getElementById("opacityValue").innerText = e.target.value;
    });
}
