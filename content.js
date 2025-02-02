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

    const ctx = canvas.getContext("2d");
    const colorPicker = document.getElementById("colorPicker");
    const brushSizeInput = document.getElementById("brushSize");

    // Tools
    const tools = {
        brush: document.getElementById("brush"),
        eraser: document.getElementById("eraser"),
        horizontalLine: document.getElementById("horizontalLine"),
        verticalLine: document.getElementById("verticalLine"),
        rectangle: document.getElementById("rectangle"),
        filledRectangle: document.getElementById("filledRectangle"),
        circle: document.getElementById("circle"),
        filledCircle: document.getElementById("filledCircle"),
    };

    let painting = false;
    let brushSize = 1;
    let opacity = 1.0;
    let brushColor = `rgba(0,0,0,${opacity})`;
    let currentTool = "brush";
    let startX, startY;
    let snapshot; // Store canvas state before drawing a rectangle

    // Set active tool
    function setActiveTool(tool) {
        currentTool = tool;
        Object.values(tools).forEach((btn) => btn.classList.remove("active"));
        tools[tool].classList.add("active");
    }

    // Convert touch event to mouse-like coordinates
    function getTouchPos(evt) {
        let rect = canvas.getBoundingClientRect();
        return {
            x: evt.touches[0].clientX - rect.left,
            y: evt.touches[0].clientY - rect.top,
        };
    }

    // Start drawing
    function startPainting(e) {
        e.preventDefault();
        painting = true;

        let pos = e.type.includes("touch") ? getTouchPos(e) : { x: e.offsetX, y: e.offsetY };
        startX = pos.x;
        startY = pos.y;

        ctx.beginPath();

        switch (currentTool) {
            case "rectangle":
            case "filledRectangle":
            case "circle":
            case "filledCircle":
                snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
                break;
            default:
                ctx.moveTo(startX, startY);
        }
    }

    // Draw function
    function draw(e) {
        if (!painting) return;
        e.preventDefault();

        let pos = e.type.includes("touch") ? getTouchPos(e) : { x: e.offsetX, y: e.offsetY };

        ctx.lineWidth = brushSize;
        ctx.lineCap = "round";
        ctx.strokeStyle = currentTool === "eraser" ? "#ffffff" : brushColor;

        switch (currentTool) {
            case "horizontalLine":
                ctx.lineTo(pos.x, startY);
                ctx.stroke();
                break;
            case "verticalLine":
                ctx.lineTo(startX, pos.y);
                ctx.stroke();
                break;
            case "rectangle":
            case "filledRectangle":
                ctx.putImageData(snapshot, 0, 0);
                let width = pos.x - startX;
                let height = pos.y - startY;
                if (currentTool === "rectangle") {
                    ctx.strokeRect(startX, startY, width, height);
                } else {
                    ctx.fillStyle = brushColor;
                    ctx.fillRect(startX, startY, width, height);
                }
                break;
            case "circle":
            case "filledCircle":
                ctx.putImageData(snapshot, 0, 0);
                const radius = Math.sqrt((startX - pos.x) ** 2 + (startY - pos.y) ** 2);
                ctx.beginPath();
                ctx.arc(startX, startY, radius, 0, Math.PI * 2);
                if (currentTool === "circle") {
                    ctx.stroke();
                } else {
                    ctx.fillStyle = brushColor;
                    ctx.fill();
                }
                break;
            default:
                ctx.lineTo(pos.x, pos.y);
                ctx.stroke();
        }
    }

    // Stop drawing
    function stopPainting() {
        painting = false;
        ctx.closePath();
    }

    // Event Listeners for mouse
    canvas.addEventListener("mousedown", startPainting);
    canvas.addEventListener("mousemove", draw);
    canvas.addEventListener("mouseup", stopPainting);
    canvas.addEventListener("mouseout", stopPainting);

    // Event Listeners for touch
    canvas.addEventListener("touchstart", startPainting);
    canvas.addEventListener("touchmove", draw);
    canvas.addEventListener("touchend", stopPainting);

    // Disable scrolling while drawing
    document.body.style.touchAction = "none";

    // Tool Handlers
    tools.brush.addEventListener("click", () => setActiveTool("brush"));
    tools.eraser.addEventListener("click", () => setActiveTool("eraser"));
    tools.horizontalLine.addEventListener("click", () => setActiveTool("horizontalLine"));
    tools.verticalLine.addEventListener("click", () => setActiveTool("verticalLine"));
    tools.rectangle.addEventListener("click", () => setActiveTool("rectangle"));
    tools.filledRectangle.addEventListener("click", () => setActiveTool("filledRectangle"));
    tools.circle.addEventListener("click", () => setActiveTool("circle"));
    tools.filledCircle.addEventListener("click", () => setActiveTool("filledCircle"));

    // Color Picker
    colorPicker.addEventListener("input", (e) => {
        brushColor = createRGBA(e.target.value, opacity);
    });

    // Brush Size
    brushSizeInput.addEventListener("input", (e) => {
        brushSize = e.target.value;
        document.getElementById("rangeValue").textContent =
            parseInt(brushSize) >= 10 ? brushSize : `0${brushSize}`;
    });

    // Clear Canvas
    document.getElementById("clear").addEventListener("click", () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    });

    document.getElementById("save").addEventListener("click", () => {
        html2canvas(document.body, {
            scrollX: 0,
            scrollY: 0,
            windowWidth: document.documentElement.scrollWidth,
            windowHeight: document.documentElement.scrollHeight,
        }).then((canvas) => {
            const link = document.createElement("a");
            link.download = "annotated_page.png";
            link.href = canvas.toDataURL("image/png");
            link.click();
        });
    });

    // Opacity Control
    document.getElementById("opacity").addEventListener("input", (e) => {
        opacity = e.target.value;
        document.getElementById("opacityValue").textContent = opacity;
        const { r, g, b } = extractRGB(brushColor);
        brushColor = `rgba(${r}, ${g}, ${b}, ${opacity})`;
    });

    function createRGBA(hex, opacity) {
        hex = hex.replace("#", "");
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }

    function extractRGB(rgbaString) {
        const rgbaRegex = /rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/;
        const match = rgbaString.match(rgbaRegex);
        return { r: parseInt(match[1], 10), g: parseInt(match[2], 10), b: parseInt(match[3], 10) };
    }
}
