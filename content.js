chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "toggleToolbar") {
        let toolbar = document.getElementById("custom-toolbar");
        if (toolbar) toolbar.remove();
        else injectToolbar();
    }
});

function injectToolbar() {
    let toolbar = document.createElement("div");
    toolbar.id = "custom-toolbar";
    toolbar.innerHTML = `
        <div id="activeColor" title="Active Color"></div>
        <div class="color-picker"></div>
        <div class="color-picker"></div>
        <div class="highlight_div">
            <button id="highlight" title="Highlight Text">🎨</button>
            <input type="number" id="highlighterSize" min="10" max="50" value="15" step="5"/>
        </div>
        <button id="filledRectangle" title="Filled rectangle">▆</button>
        <button id="brush" class="active">🖌️</button>
        <button id="horizontalLine" title="straight line">==</button>
        <button id="rectangle" title="Rectangle">▭</button>
        <div class="range_div">
            <label for="brushSize">Size</label>
            <input type="range" id="brushSize" min="1" max="50" value="1" />
            <span id="rangeValue">01</span>
        </div>
        <button id="clear" title="Erase everything">🆑</button>
        <div class="undo_redo">
            <button id="undo" title="undo">↶</button>
            <button id="redo" title="redo">↷</button>
        </div>
        <div class="range_div">
            <label for="opacity">🪟</label>
            <input type="range" title="Adjust opacity" id="opacity" min="0.00" max="1.00" step="0.01" value="1" />
            <span id="opacityValue">1.00</span>
        </div>
        <button id="save" title="Take Snapshot">💾</button>
        <button id="exit">❌</button>
    `;
    document.body.prepend(toolbar);

    const colors = `
            <div class="color-picker-button" title="Color Picker"></div>
            <div class="color-swatches">
                <div class="color-swatch" data-color="#ffffff" style="background-color: #ffffff"></div>
                <div class="color-swatch" data-color="#000000" style="background-color: #000000"></div>
                <div class="color-swatch" data-color="#ff0000" style="background-color: #ff0000"></div>
                <div class="color-swatch" data-color="#f43f5e" style="background-color: #f43f5e"></div>
                <div class="color-swatch" data-color="#9f1239" style="background-color: #9f1239"></div>
                <div class="color-swatch" data-color="#4B0001" style="background-color: #4B0001"></div>
                <div class="color-swatch" data-color="#964B00" style="background-color: #964B00"></div>
                <div class="color-swatch" data-color="#BE5103" style="background-color: #BE5103"></div>
                <div class="color-swatch" data-color="#ffa500" style="background-color: #ffa500"></div>
                <div class="color-swatch" data-color="#00ff00" style="background-color: #00ff00"></div>
                <div class="color-swatch" data-color="#009c1a" style="background-color: #009c1a"></div>
                <div class="color-swatch" data-color="#429A31" style="background-color: #429A31"></div>
                <div class="color-swatch" data-color="#84cc16" style="background-color: #84cc16"></div>
                <div class="color-swatch" data-color="#365314" style="background-color: #365314"></div>
                <div class="color-swatch" data-color="#134e4a" style="background-color: #134e4a"></div>
                <div class="color-swatch" data-color="#050372" style="background-color: #050372"></div>
                <div class="color-swatch" data-color="#0000ff" style="background-color: #0000ff"></div>
                <div class="color-swatch" data-color="#0047ab" style="background-color: #0047ab"></div>
                <div class="color-swatch" data-color="#2B0057" style="background-color: #2B0057"></div>
                <div class="color-swatch" data-color="#51158C" style="background-color: #51158C"></div>
                <div class="color-swatch" data-color="#7F00FF" style="background-color: #7F00FF"></div>
                <div class="color-swatch" data-color="#B163FF" style="background-color: #B163FF"></div>
                <div class="color-swatch" data-color="#ff00ff" style="background-color: #ff00ff"></div>
                <div class="color-swatch" data-color="#0e98ba" style="background-color: #0e98ba"></div>
                <div class="color-swatch" data-color="#00ffff" style="background-color: #00ffff"></div>
                <div class="color-swatch" data-color="#ffff00" style="background-color: #ffff00"></div>
            </div>
    `;

    const colorPickers = document.querySelectorAll(".color-picker");
    colorPickers.forEach((colorPicker) => {
        colorPicker.innerHTML = colors;
    });

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
    const brushSizeInput = document.getElementById("brushSize");

    // Tools
    const tools = {
        brush: document.getElementById("brush"),
        highlighter: document.getElementById("highlight"),
        horizontalLine: document.getElementById("horizontalLine"),
        rectangle: document.getElementById("rectangle"),
        filledRectangle: document.getElementById("filledRectangle"),
    };

    let painting = false;
    let brushSize = 1;
    let highlighterSize = 15;
    let opacity = 1.0;
    let color1 = `rgba(0,0,0,${opacity})`;
    let color2 = `rgba(255, 255, 0, 0.4)`;
    let currentTool = "brush";
    let startX, startY;
    let snapshot; // Store canvas state before drawing a rectangle
    const undoStack = [];
    const redoStack = [];

    const [colorPicker1, colorPicker2] = document.querySelectorAll(".color-picker");
    colorPicker1.children[0].style.backgroundColor = color1;
    colorPicker2.children[0].style.backgroundColor = color2;

    // Set active tool
    function setActiveTool(tool) {
        currentTool = tool;
        Object.values(tools).forEach((btn) => btn.classList.remove("active"));
        tools[tool].classList.add("active");
        if (tool === "highlighter" || tool === "filledRectangle") {
            document.getElementById("activeColor").style.backgroundColor = color2;
        } else {
            document.getElementById("activeColor").style.backgroundColor = color1;
        }
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
            case "highlighter":
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
        ctx.strokeStyle = color1;

        switch (currentTool) {
            case "horizontalLine":
                ctx.lineTo(pos.x, startY);
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
                    ctx.fillStyle = color2;
                    ctx.fillRect(startX, startY, width, height);
                }
                break;
            case "highlighter":
                ctx.putImageData(snapshot, 0, 0);
                let w = pos.x - startX;
                ctx.fillStyle = color2;
                ctx.fillRect(startX, startY, w, highlighterSize);
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

        const state = canvas.toDataURL();
        undoStack.push(state);
        redoStack.length = 0;
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
    tools.highlighter.addEventListener("click", () => setActiveTool("highlighter"));
    tools.horizontalLine.addEventListener("click", () => setActiveTool("horizontalLine"));
    tools.rectangle.addEventListener("click", () => setActiveTool("rectangle"));
    tools.filledRectangle.addEventListener("click", () => setActiveTool("filledRectangle"));

    // highlighter Size
    document.getElementById("highlighterSize").addEventListener("input", (e) => {
        highlighterSize = parseInt(e.target.value);
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
        document.getElementById("opacityValue").textContent = parseFloat(opacity).toFixed(2);

        const { r, g, b } = extractRGB(color2);
        color1 = `rgba(${r}, ${g}, ${b}, ${opacity})`;
        document.getElementById("activeColor").style.backgroundColor = color1;
    });

    document.getElementById("exit")?.addEventListener("click", () => {
        ["drawingCanvas", "custom-toolbar"].forEach((id) => {
            document.getElementById(id)?.remove();
        });
    });

    // Undo functionality
    document.getElementById("undo").addEventListener("click", () => {
        if (undoStack.length >= 1) {
            // Ensure there's a state to undo to
            const currentState = undoStack.pop(); // Pop current state
            redoStack.push(currentState); // Push to redo stack
            const prevState = undoStack[undoStack.length - 1]; // Get previous state
            restoreCanvas(prevState); // Restore canvas
        }
    });

    // Redo functionality
    document.getElementById("redo").addEventListener("click", () => {
        if (redoStack.length > 0) {
            // Ensure there's a state to redo to
            const nextState = redoStack.pop(); // Pop next state
            undoStack.push(nextState); // Push to undo stack
            restoreCanvas(nextState); // Restore canvas
        }
    });

    // Function to restore canvas from a state
    function restoreCanvas(state) {
        const img = new Image();
        img.src = state;
        img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas
            ctx.drawImage(img, 0, 0); // Draw the saved state
        };
    }

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

    // Code for color pickers
    function assignColor(colorPicker, colorVariable) {
        // Code for predifined color
        const colorPickerButton = colorPicker.querySelector(".color-picker-button");
        const colorSwatches = colorPicker.querySelector(".color-swatches");
        console.log(colorSwatches);

        // Toggle color swatches visibility on button click
        colorPickerButton.addEventListener("click", function (event) {
            event.stopPropagation(); // Prevent event from bubbling up
            colorSwatches.classList.toggle("visible");
        });

        // Handle color selection
        colorSwatches.querySelectorAll(".color-swatch").forEach((swatch) => {
            swatch.addEventListener("click", function () {
                // Get the selected color's hex code
                const selectedColor = this.getAttribute("data-color");
                // Update button color
                colorPickerButton.style.backgroundColor = selectedColor;
                // Hide swatches after selection
                colorSwatches.classList.remove("visible");

                if (colorVariable === 1) color1 = createRGBA(selectedColor, opacity);
                else color2 = createRGBA(selectedColor, 0.4);

                if (currentTool === "highlighter" || currentTool === "filledRectangle")
                    document.getElementById("activeColor").style.backgroundColor = color2;
                else document.getElementById("activeColor").style.backgroundColor = color1;
            });
        });

        // Close swatches when clicking outside
        document.addEventListener("click", function (event) {
            if (!event.target.closest(".color-picker")) colorSwatches.classList.remove("visible");
        });
    }

    assignColor(colorPicker1, 1);
    assignColor(colorPicker2, 2);
}
