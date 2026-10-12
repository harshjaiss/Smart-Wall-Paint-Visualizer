/* ==========================================================================
   Smart Wall Paint Visualizer - Complete JavaScript Logic
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // Application State
    const state = {
        imageSrc: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80',
        originalImage: null,
        canvasImage: null,
        walls: [], // Array of wall objects: { id, points: [{x, y}], color: '#hex', finish: 'matte', opacity: 0.75, blendMode: 'multiply' }
        activeWallId: null,
        activeTool: 'select', // 'select', 'polygon', 'pan'
        currentPolygonPoints: [],
        selectedColor: { name: 'Cashmere Cream', hex: '#EBE5D8', category: 'neutral' },
        selectedFinish: 'matte', // matte, satin, gloss, metallic
        roomDimensions: { width: 12, height: 9, length: 14, doors: 1, windows: 2 },
        paintPricePerGallon: 45.00,
        savedProjects: []
    };

    // Preset Room Images
    const presetImages = [
        'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80'
    ];

    // Paint Color Palette
    const paintPalette = [
        { name: 'Cashmere Cream', hex: '#EBE5D8', category: 'neutral' },
        { name: 'Warm Taupe', hex: '#C8B7A6', category: 'neutral' },
        { name: 'Pebble Gray', hex: '#D1D5DB', category: 'neutral' },
        { name: 'Pure Cotton', hex: '#F9FAFB', category: 'neutral' },

        { name: 'Ocean Mist', hex: '#BAE6FD', category: 'blue' },
        { name: 'Deep Indigo', hex: '#1E3A8A', category: 'blue' },
        { name: 'Slate Teal', hex: '#0F766E', category: 'blue' },
        { name: 'Soft Denim', hex: '#60A5FA', category: 'blue' },

        { name: 'Sage Green', hex: '#A7F3D0', category: 'green' },
        { name: 'Olive Grove', hex: '#3F6212', category: 'green' },
        { name: 'Eucalyptus', hex: '#6EE7B7', category: 'green' },
        { name: 'Forest Shadow', hex: '#064E3B', category: 'green' },

        { name: 'Terracotta', hex: '#F87171', category: 'warm' },
        { name: 'Sunlit Amber', hex: '#FBBF24', category: 'warm' },
        { name: 'Rose Quartz', hex: '#FBCFE8', category: 'warm' },
        { name: 'Burgundy', hex: '#831843', category: 'warm' }
    ];

    // DOM Elements
    const canvas = document.getElementById('roomCanvas');
    const ctx = canvas.getContext('2d');
    const fileInput = document.getElementById('fileInput');
    const colorGrid = document.getElementById('colorGrid');
    const categoryContainer = document.getElementById('categoryContainer');
    const presetsContainer = document.getElementById('presetsContainer');
    const finishCards = document.querySelectorAll('.finish-card');
    const toolBtns = document.querySelectorAll('.tool-btn');
    const instructionOverlay = document.getElementById('instructionOverlay');
    const toastContainer = document.getElementById('toastContainer');

    // Estimator elements
    const widthInput = document.getElementById('roomWidth');
    const heightInput = document.getElementById('roomHeight');
    const lengthInput = document.getElementById('roomLength');
    const doorsInput = document.getElementById('roomDoors');
    const windowsInput = document.getElementById('roomWindows');
    const priceInput = document.getElementById('paintPrice');

    const statArea = document.getElementById('statArea');
    const statGallons = document.getElementById('statGallons');
    const statCost = document.getElementById('statCost');

    // Modals & Triggers
    const saveModal = document.getElementById('saveModal');
    const loadModal = document.getElementById('loadModal');
    const projectsList = document.getElementById('projectsList');

    // Initialize Application
    function init() {
        renderPresets();
        renderColorPalette('all');
        setupEventListeners();
        loadImage(state.imageSrc);
        updateEstimator();
    }

    // Load and draw image onto canvas
    function loadImage(src) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            state.originalImage = img;
            canvas.width = img.naturalWidth || 1200;
            canvas.height = img.naturalHeight || 800;
            redrawCanvas();
        };
        img.src = src;
    }

    // Redraw canvas with room image and applied walls
    function redrawCanvas() {
        if (!state.originalImage) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(state.originalImage, 0, 0, canvas.width, canvas.height);

        // Draw applied walls
        state.walls.forEach(wall => {
            if (wall.points.length < 3) return;
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(wall.points[0].x, wall.points[0].y);
            for (let i = 1; i < wall.points.length; i++) {
                ctx.lineTo(wall.points[i].x, wall.points[i].y);
            }
            ctx.closePath();

            // Apply finish & blend mode
            ctx.fillStyle = wall.color;
            ctx.globalAlpha = wall.opacity || 0.75;
            ctx.globalCompositeOperation = wall.blendMode || 'multiply';
            ctx.fill();

            // Add specular highlight if glossy
            if (wall.finish === 'gloss') {
                ctx.globalCompositeOperation = 'overlay';
                ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
                ctx.fill();
            }

            ctx.restore();

            // Draw outline if active
            if (wall.id === state.activeWallId) {
                ctx.save();
                ctx.strokeStyle = '#4f46e5';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(wall.points[0].x, wall.points[0].y);
                wall.points.forEach(p => ctx.lineTo(p.x, p.y));
                ctx.closePath();
                ctx.stroke();

                // Draw vertex handles
                wall.points.forEach(p => {
                    ctx.fillStyle = '#ffffff';
                    ctx.strokeStyle = '#4f46e5';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.stroke();
                });
                ctx.restore();
            }
        });

        // Draw active polygon drawing points
        if (state.activeTool === 'polygon' && state.currentPolygonPoints.length > 0) {
            ctx.save();
            ctx.strokeStyle = '#0ea5e9';
            ctx.lineWidth = 3;
            ctx.fillStyle = 'rgba(14, 165, 233, 0.2)';
            ctx.beginPath();
            ctx.moveTo(state.currentPolygonPoints[0].x, state.currentPolygonPoints[0].y);
            state.currentPolygonPoints.forEach(p => ctx.lineTo(p.x, p.y));
            ctx.stroke();

            state.currentPolygonPoints.forEach(p => {
                ctx.fillStyle = '#ffffff';
                ctx.strokeStyle = '#0ea5e9';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
            });
            ctx.restore();
        }
    }

    // Setup Event Listeners
    function setupEventListeners() {
        // Preset thumbnails
        presetsContainer.addEventListener('click', (e) => {
            const thumb = e.target.closest('.preset-thumb');
            if (!thumb) return;
            document.querySelectorAll('.preset-thumb').forEach(t => t.classList.remove('active'));
            thumb.classList.add('active');
            state.imageSrc = thumb.dataset.src;
            state.walls = [];
            loadImage(state.imageSrc);
            showToast('Loaded preset room photo.');
        });

        // File Upload
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (event) => {
                state.imageSrc = event.target.result;
                state.walls = [];
                loadImage(state.imageSrc);
                showToast('Successfully uploaded room photo!');
            };
            reader.readAsDataURL(file);
        });

        // Tool Switcher
        toolBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                toolBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                state.activeTool = btn.dataset.tool;

                if (state.activeTool === 'polygon') {
                    state.currentPolygonPoints = [];
                    instructionOverlay.style.display = 'flex';
                    instructionOverlay.innerHTML = '<i class="fas fa-info-circle"></i> Click points around the wall. Double-click or click first point to close.';
                } else {
                    instructionOverlay.style.display = 'none';
                }
                redrawCanvas();
            });
        });

        // Canvas Mouse / Click Interaction
        canvas.addEventListener('click', (e) => {
            if (state.activeTool !== 'polygon') return;

            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            const x = (e.clientX - rect.left) * scaleX;
            const y = (e.clientY - rect.top) * scaleY;

            // Check if clicking near start point to close polygon
            const points = state.currentPolygonPoints;
            if (points.length >= 2) {
                const dist = Math.hypot(points[0].x - x, points[0].y - y);
                if (dist < 20 / rect.width * canvas.width) {
                    // Close and save wall
                    completePolygonWall();
                    return;
                }
            }

            points.push({ x, y });
            redrawCanvas();
        });

        // Double click to complete polygon
        canvas.addEventListener('dblclick', () => {
            if (state.activeTool === 'polygon' && state.currentPolygonPoints.length >= 3) {
                completePolygonWall();
            }
        });

        // Finish selector
        finishCards.forEach(card => {
            card.addEventListener('click', () => {
                finishCards.forEach(c => c.classList.remove('active'));
                card.classList.add('active');
                state.selectedFinish = card.dataset.finish;

                if (state.activeWallId) {
                    const wall = state.walls.find(w => w.id === state.activeWallId);
                    if (wall) {
                        wall.finish = state.selectedFinish;
                        wall.blendMode = state.selectedFinish === 'gloss' ? 'overlay' : 'multiply';
                        wall.opacity = state.selectedFinish === 'matte' ? 0.8 : 0.7;
                        redrawCanvas();
                    }
                }
            });
        });

        // Estimator input changes
        [widthInput, heightInput, lengthInput, doorsInput, windowsInput, priceInput].forEach(input => {
            input.addEventListener('input', () => {
                state.roomDimensions.width = parseFloat(widthInput.value) || 0;
                state.roomDimensions.height = parseFloat(heightInput.value) || 0;
                state.roomDimensions.length = parseFloat(lengthInput.value) || 0;
                state.roomDimensions.doors = parseInt(doorsInput.value) || 0;
                state.roomDimensions.windows = parseInt(windowsInput.value) || 0;
                state.paintPricePerGallon = parseFloat(priceInput.value) || 45;
                updateEstimator();
            });
        });

        // Modal Triggers
        document.getElementById('btnSaveProject').addEventListener('click', () => {
            saveModal.classList.add('open');
        });

        document.getElementById('btnLoadProject').addEventListener('click', () => {
            renderSavedProjectsList();
            loadModal.classList.add('open');
        });

        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => {
                saveModal.classList.remove('open');
                loadModal.classList.remove('open');
            });
        });

        document.getElementById('confirmSaveBtn').addEventListener('click', () => {
            const title = document.getElementById('projectNameInput').value.trim() || 'My Painted Room';
            const project = {
                id: Date.now(),
                title,
                date: new Date().toLocaleDateString(),
                imageSrc: state.imageSrc,
                walls: state.walls
            };
            state.savedProjects.push(project);
            saveModal.classList.remove('open');
            showToast(`Project "${title}" saved successfully!`);
        });

        // Reset Walls
        document.getElementById('btnResetWalls').addEventListener('click', () => {
            state.walls = [];
            state.activeWallId = null;
            redrawCanvas();
            showToast('Cleared all painted walls.');
        });
    }

    // Complete Polygon Wall Creation
    function completePolygonWall() {
        const newWall = {
            id: Date.now(),
            points: [...state.currentPolygonPoints],
            color: state.selectedColor.hex,
            finish: state.selectedFinish,
            opacity: state.selectedFinish === 'matte' ? 0.8 : 0.7,
            blendMode: state.selectedFinish === 'gloss' ? 'overlay' : 'multiply'
        };
        state.walls.push(newWall);
        state.activeWallId = newWall.id;
        state.currentPolygonPoints = [];
        state.activeTool = 'select';

        document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
        document.querySelector('[data-tool="select"]').classList.add('active');
        instructionOverlay.style.display = 'none';

        redrawCanvas();
        showToast('Wall painted successfully!');
    }

    // Render Presets
    function renderPresets() {
        presetsContainer.innerHTML = presetImages.map((src, idx) => `
      <div class="preset-thumb ${idx === 0 ? 'active' : ''}" data-src="${src}">
        <img src="${src}" alt="Preset Room ${idx + 1}" />
      </div>
    `).join('');
    }

    // Render Color Palette & Categories
    function renderColorPalette(category) {
        categoryContainer.innerHTML = `
      <div class="category-pill ${category === 'all' ? 'active' : ''}" data-cat="all">All</div>
      <div class="category-pill ${category === 'neutral' ? 'active' : ''}" data-cat="neutral">Neutrals</div>
      <div class="category-pill ${category === 'blue' ? 'active' : ''}" data-cat="blue">Blues</div>
      <div class="category-pill ${category === 'green' ? 'active' : ''}" data-cat="green">Greens</div>
      <div class="category-pill ${category === 'warm' ? 'active' : ''}" data-cat="warm">Warm</div>
    `;

        categoryContainer.querySelectorAll('.category-pill').forEach(pill => {
            pill.addEventListener('click', () => {
                renderColorPalette(pill.dataset.cat);
            });
        });

        const filteredColors = category === 'all'
            ? paintPalette
            : paintPalette.filter(c => c.category === category);

        colorGrid.innerHTML = filteredColors.map(color => `
      <div class="color-card ${state.selectedColor.hex === color.hex ? 'active' : ''}" 
           style="background-color: ${color.hex};" 
           data-hex="${color.hex}" 
           data-name="${color.name}">
        <span class="color-card-name">${color.name}</span>
      </div>
    `).join('');

        colorGrid.querySelectorAll('.color-card').forEach(card => {
            card.addEventListener('click', () => {
                colorGrid.querySelectorAll('.color-card').forEach(c => c.classList.remove('active'));
                card.classList.add('active');
                state.selectedColor = { name: card.dataset.name, hex: card.dataset.hex };

                // Apply to active wall if selected
                if (state.activeWallId) {
                    const wall = state.walls.find(w => w.id === state.activeWallId);
                    if (wall) {
                        wall.color = state.selectedColor.hex;
                        redrawCanvas();
                    }
                }
            });
        });
    }

    // Update Paint Estimator Calculations
    function updateEstimator() {
        const { width, height, length, doors, windows } = state.roomDimensions;
        // Total perimeter wall area = 2 * (width + length) * height
        const grossArea = 2 * (width + length) * height;
        // Deductions: standard door ~21 sq ft, window ~15 sq ft
        const deductions = (doors * 21) + (windows * 15);
        const netArea = Math.max(0, grossArea - deductions);

        // Average paint coverage ~ 350 sq ft per gallon for 2 coats
        const gallonsNeeded = Math.ceil((netArea / 350) * 10) / 10;
        const totalCost = Math.ceil(gallonsNeeded * state.paintPricePerGallon);

        statArea.textContent = `${netArea.toLocaleString()} sq ft`;
        statGallons.textContent = `${gallonsNeeded} gal`;
        statCost.textContent = `$${totalCost.toLocaleString()}`;
    }

    // Render Saved Projects in Load Modal
    function renderSavedProjectsList() {
        if (state.savedProjects.length === 0) {
            projectsList.innerHTML = `<p style="color: var(--gray-500); text-align: center; font-size: 0.875rem;">No saved projects found. Save your current design first!</p>`;
            return;
        }

        projectsList.innerHTML = state.savedProjects.map(proj => `
      <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.75rem; border: 1px solid var(--gray-200); border-radius: var(--radius); margin-bottom: 0.5rem;">
        <div>
          <strong>${proj.title}</strong>
          <span style="display: block; font-size: 0.75rem; color: var(--gray-500);">Saved on ${proj.date}</span>
        </div>
        <button class="btn btn-primary btn-sm load-proj-btn" data-id="${proj.id}">Load</button>
      </div>
    `).join('');

        projectsList.querySelectorAll('.load-proj-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = Number(btn.dataset.id);
                const proj = state.savedProjects.find(p => p.id === id);
                if (proj) {
                    state.imageSrc = proj.imageSrc;
                    state.walls = [...proj.walls];
                    loadImage(state.imageSrc);
                    loadModal.classList.remove('open');
                    showToast(`Loaded project "${proj.title}"`);
                }
            });
        });
    }

    // Toast Notifications
    function showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.innerHTML = `<i class="fas fa-check-circle" style="color: var(--success);"></i> ${message}`;
        toastContainer.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // Run app
    init();
});