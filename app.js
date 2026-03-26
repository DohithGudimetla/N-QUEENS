/* ══════════════════════════════════════════════
   N-QUEENS VISUALIZER — APPLICATION
   ══════════════════════════════════════════════ */

(function () {
    'use strict';

    // ═══════════════ CONFIGURATION ═══════════════
    const CONFIG = {
        FRAME_DIR: 'ezgif-74dbd0585478b14e-jpg/',
        TOTAL_FRAMES: 165,
        MIN_N: 1,
        MAX_N: 12,
        MIN_DELAY: 20,
        MAX_DELAY: 800,
        COLORS: {
            bgPrimary: '#05070B',
            boardLight: '#2A2F3A',
            boardDark: '#1A1E28',
            accent: '#3B82F6',
            accentGlow: 'rgba(59, 130, 246, 0.35)',
            gold: '#F59E0B',
            goldGlow: 'rgba(245, 158, 11, 0.4)',
            red: '#EF4444',
            redGlow: 'rgba(239, 68, 68, 0.3)',
            queenColor: '#E8ECF4',
            queenShadow: 'rgba(59, 130, 246, 0.5)',
            gridLine: 'rgba(59, 130, 246, 0.06)',
            textMuted: '#4A5568',
            green: '#10B981',
        }
    };

    // ═══════════════ N-QUEENS SOLVER ═══════════════
    class NQueensSolver {
        constructor(n) {
            this.n = n;
            this.board = new Array(n).fill(-1);
            this.solutions = [];
            this.steps = [];
        }

        isSafe(row, col) {
            for (let i = 0; i < row; i++) {
                if (this.board[i] === col) return false;
                if (Math.abs(this.board[i] - col) === Math.abs(i - row)) return false;
            }
            return true;
        }

        solve() {
            this.solutions = [];
            this.steps = [];
            this.board = new Array(this.n).fill(-1);
            this._backtrack(0);
            return { solutions: this.solutions, steps: this.steps };
        }

        _backtrack(row) {
            if (row === this.n) {
                const solution = [...this.board];
                this.solutions.push(solution);
                this.steps.push({ type: 'solution', board: solution, index: this.solutions.length });
                return;
            }

            for (let col = 0; col < this.n; col++) {
                this.steps.push({ type: 'try', row, col, board: [...this.board] });

                if (this.isSafe(row, col)) {
                    this.board[row] = col;
                    this.steps.push({ type: 'place', row, col, board: [...this.board] });
                    this._backtrack(row + 1);
                    this.board[row] = -1;
                    if (row < this.n) {
                        this.steps.push({ type: 'remove', row, col, board: [...this.board] });
                    }
                } else {
                    this.steps.push({ type: 'conflict', row, col, board: [...this.board] });
                }
            }
        }
    }

    // ═══════════════ BOARD RENDERER ═══════════════
    class BoardRenderer {
        constructor(canvas) {
            this.canvas = canvas;
            this.ctx = canvas.getContext('2d');
            this.n = 8;
            this.padding = 24;
            this.cellSize = 0;
            this.boardOrigin = { x: 0, y: 0 };
            this.animations = [];
        }

        resize(n) {
            this.n = n || this.n;
            const container = this.canvas.parentElement;
            const size = Math.min(container.clientWidth, container.clientHeight);
            const dpr = window.devicePixelRatio || 1;
            this.canvas.width = size * dpr;
            this.canvas.height = size * dpr;
            this.canvas.style.width = size + 'px';
            this.canvas.style.height = size + 'px';
            this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

            this.cellSize = (size - this.padding * 2) / this.n;
            this.boardOrigin = { x: this.padding, y: this.padding };
        }

        clear() {
            const w = this.canvas.width / (window.devicePixelRatio || 1);
            const h = this.canvas.height / (window.devicePixelRatio || 1);
            this.ctx.clearRect(0, 0, w, h);
        }

        drawBoard() {
            const ctx = this.ctx;
            const { x: ox, y: oy } = this.boardOrigin;
            const cs = this.cellSize;

            for (let r = 0; r < this.n; r++) {
                for (let c = 0; c < this.n; c++) {
                    const isDark = (r + c) % 2 === 1;
                    ctx.fillStyle = isDark ? CONFIG.COLORS.boardDark : CONFIG.COLORS.boardLight;
                    ctx.fillRect(ox + c * cs, oy + r * cs, cs, cs);
                }
            }

            // Grid lines
            ctx.strokeStyle = CONFIG.COLORS.gridLine;
            ctx.lineWidth = 0.5;
            for (let i = 0; i <= this.n; i++) {
                ctx.beginPath();
                ctx.moveTo(ox + i * cs, oy);
                ctx.lineTo(ox + i * cs, oy + this.n * cs);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(ox, oy + i * cs);
                ctx.lineTo(ox + this.n * cs, oy + i * cs);
                ctx.stroke();
            }

            // Board border glow
            ctx.strokeStyle = 'rgba(59, 130, 246, 0.12)';
            ctx.lineWidth = 1;
            ctx.strokeRect(ox, oy, this.n * cs, this.n * cs);

            // Row/col labels
            ctx.fillStyle = CONFIG.COLORS.textMuted;
            ctx.font = `${Math.max(9, cs * 0.18)}px 'JetBrains Mono', monospace`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            for (let i = 0; i < this.n; i++) {
                // Column labels
                ctx.fillText(String.fromCharCode(97 + i), ox + i * cs + cs / 2, oy + this.n * cs + 6);
                // Row labels
                ctx.textBaseline = 'middle';
                ctx.fillText(String(this.n - i), ox - 12, oy + i * cs + cs / 2);
            }
        }

        drawQueen(row, col, color, glow, scale) {
            const ctx = this.ctx;
            const cs = this.cellSize;
            const cx = this.boardOrigin.x + col * cs + cs / 2;
            const cy = this.boardOrigin.y + row * cs + cs / 2;
            const s = (scale || 1) * cs * 0.36;

            ctx.save();

            // Glow
            if (glow) {
                ctx.shadowColor = glow;
                ctx.shadowBlur = 18;
            }

            // Queen symbol
            ctx.fillStyle = color || CONFIG.COLORS.queenColor;
            ctx.font = `bold ${s * 2}px serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('♛', cx, cy);

            ctx.restore();
        }

        highlightCell(row, col, color, alpha) {
            const ctx = this.ctx;
            const cs = this.cellSize;
            const x = this.boardOrigin.x + col * cs;
            const y = this.boardOrigin.y + row * cs;

            ctx.fillStyle = color;
            ctx.globalAlpha = alpha || 0.2;
            ctx.fillRect(x, y, cs, cs);
            ctx.globalAlpha = 1;
        }

        drawAttackLines(row, col) {
            const ctx = this.ctx;
            const cs = this.cellSize;
            const ox = this.boardOrigin.x;
            const oy = this.boardOrigin.y;
            const cx = ox + col * cs + cs / 2;
            const cy = oy + row * cs + cs / 2;

            ctx.save();
            ctx.strokeStyle = CONFIG.COLORS.red;
            ctx.globalAlpha = 0.2;
            ctx.lineWidth = 1;
            ctx.setLineDash([4, 4]);

            // Row line
            ctx.beginPath();
            ctx.moveTo(ox, cy);
            ctx.lineTo(ox + this.n * cs, cy);
            ctx.stroke();

            // Column line
            ctx.beginPath();
            ctx.moveTo(cx, oy);
            ctx.lineTo(cx, oy + this.n * cs);
            ctx.stroke();

            // Diagonals
            for (let d = -this.n; d <= this.n; d++) {
                const r1 = row + d, c1 = col + d;
                const r2 = row + d, c2 = col - d;
                if (r1 >= 0 && r1 < this.n && c1 >= 0 && c1 < this.n) {
                    this.highlightCell(r1, c1, CONFIG.COLORS.red, 0.06);
                }
                if (r2 >= 0 && r2 < this.n && c2 >= 0 && c2 < this.n) {
                    this.highlightCell(r2, c2, CONFIG.COLORS.red, 0.06);
                }
            }

            // Diagonal lines
            ctx.beginPath();
            ctx.moveTo(cx - Math.min(row, col) * cs, cy - Math.min(row, col) * cs);
            ctx.lineTo(cx + Math.min(this.n - 1 - row, this.n - 1 - col) * cs, cy + Math.min(this.n - 1 - row, this.n - 1 - col) * cs);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(cx + Math.min(row, this.n - 1 - col) * cs, cy - Math.min(row, this.n - 1 - col) * cs);
            ctx.lineTo(cx - Math.min(this.n - 1 - row, col) * cs, cy + Math.min(this.n - 1 - row, col) * cs);
            ctx.stroke();

            ctx.setLineDash([]);
            ctx.restore();
        }

        renderState(board, highlight, highlightType) {
            this.clear();
            this.drawBoard();

            // Draw attack overlay for highlight
            if (highlight && highlightType === 'conflict') {
                this.highlightCell(highlight.row, highlight.col, CONFIG.COLORS.red, 0.25);
                this.drawAttackLines(highlight.row, highlight.col);
            }

            if (highlight && highlightType === 'try') {
                this.highlightCell(highlight.row, highlight.col, CONFIG.COLORS.accent, 0.12);
            }

            // Draw placed queens
            for (let r = 0; r < board.length; r++) {
                if (board[r] >= 0) {
                    const isHighlighted = highlight && highlight.row === r && highlight.col === board[r];
                    const isSolution = highlightType === 'solution';
                    const color = isSolution ? CONFIG.COLORS.gold : CONFIG.COLORS.queenColor;
                    const glow = isSolution ? CONFIG.COLORS.goldGlow : CONFIG.COLORS.queenShadow;
                    this.drawQueen(r, board[r], color, glow, isHighlighted ? 1.1 : 1);
                }
            }

            // Draw conflict queen
            if (highlight && highlightType === 'conflict') {
                this.drawQueen(highlight.row, highlight.col, CONFIG.COLORS.red, CONFIG.COLORS.redGlow, 0.8);
            }
        }

        renderSolution(board) {
            this.clear();
            this.drawBoard();
            for (let r = 0; r < board.length; r++) {
                if (board[r] >= 0) {
                    this.drawQueen(r, board[r], CONFIG.COLORS.gold, CONFIG.COLORS.goldGlow);
                }
            }
        }

        renderEmpty() {
            this.clear();
            this.drawBoard();
        }
    }

    // ═══════════════ MINI BOARD RENDERER (for solution thumbnails) ═══════════════
    class MiniBoardRenderer {
        constructor(canvas, n) {
            this.canvas = canvas;
            this.ctx = canvas.getContext('2d');
            this.n = n;
        }

        render(board) {
            const dpr = window.devicePixelRatio || 1;
            const size = this.canvas.parentElement.clientWidth;
            this.canvas.width = size * dpr;
            this.canvas.height = size * dpr;
            this.canvas.style.width = size + 'px';
            this.canvas.style.height = size + 'px';
            this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

            const pad = 4;
            const cs = (size - pad * 2) / this.n;

            for (let r = 0; r < this.n; r++) {
                for (let c = 0; c < this.n; c++) {
                    const isDark = (r + c) % 2 === 1;
                    this.ctx.fillStyle = isDark ? CONFIG.COLORS.boardDark : CONFIG.COLORS.boardLight;
                    this.ctx.fillRect(pad + c * cs, pad + r * cs, cs, cs);
                }
            }

            // Queens
            for (let r = 0; r < board.length; r++) {
                if (board[r] >= 0) {
                    const cx = pad + board[r] * cs + cs / 2;
                    const cy = pad + r * cs + cs / 2;
                    this.ctx.fillStyle = CONFIG.COLORS.gold;
                    this.ctx.font = `bold ${cs * 0.65}px serif`;
                    this.ctx.textAlign = 'center';
                    this.ctx.textBaseline = 'middle';
                    this.ctx.fillText('♛', cx, cy);
                }
            }
        }
    }

    // ═══════════════ ANIMATION CONTROLLER ═══════════════
    class AnimationController {
        constructor(renderer, onUpdate) {
            this.renderer = renderer;
            this.onUpdate = onUpdate;
            this.steps = [];
            this.currentStep = 0;
            this.isPlaying = false;
            this.isPaused = false;
            this.speed = 50; // 1-100
            this.timer = null;
            this.stats = { steps: 0, solutions: 0, backtracks: 0 };
        }

        setSteps(steps) {
            this.steps = steps;
            this.currentStep = 0;
            this.stats = { steps: 0, solutions: 0, backtracks: 0 };
        }

        getDelay() {
            // Map speed 1-100 to delay MAX_DELAY..MIN_DELAY (inverted)
            const t = (this.speed - 1) / 99;
            return CONFIG.MAX_DELAY - t * (CONFIG.MAX_DELAY - CONFIG.MIN_DELAY);
        }

        play() {
            if (this.currentStep >= this.steps.length) return;
            this.isPlaying = true;
            this.isPaused = false;
            this._tick();
        }

        pause() {
            this.isPaused = true;
            this.isPlaying = false;
            clearTimeout(this.timer);
        }

        reset() {
            this.isPlaying = false;
            this.isPaused = false;
            this.currentStep = 0;
            this.stats = { steps: 0, solutions: 0, backtracks: 0 };
            clearTimeout(this.timer);
        }

        _tick() {
            if (!this.isPlaying || this.currentStep >= this.steps.length) {
                if (this.currentStep >= this.steps.length) {
                    this.isPlaying = false;
                    this.onUpdate('complete', this.stats);
                }
                return;
            }

            const step = this.steps[this.currentStep];
            this.stats.steps++;

            switch (step.type) {
                case 'try':
                    this.renderer.renderState(step.board, { row: step.row, col: step.col }, 'try');
                    break;
                case 'place':
                    this.renderer.renderState(step.board, { row: step.row, col: step.col }, 'place');
                    break;
                case 'conflict':
                    this.renderer.renderState(step.board, { row: step.row, col: step.col }, 'conflict');
                    break;
                case 'remove':
                    this.stats.backtracks++;
                    this.renderer.renderState(step.board, { row: step.row, col: step.col }, 'remove');
                    break;
                case 'solution':
                    this.stats.solutions++;
                    this.renderer.renderState(step.board, null, 'solution');
                    break;
            }

            this.onUpdate('step', this.stats, step);
            this.currentStep++;

            // Pause longer on solutions
            const delay = step.type === 'solution' ? this.getDelay() * 4 : this.getDelay();
            this.timer = setTimeout(() => this._tick(), delay);
        }
    }

    // ═══════════════ HERO FRAME ANIMATION ═══════════════
    class HeroFramePlayer {
        constructor(canvas) {
            this.canvas = canvas;
            this.ctx = canvas.getContext('2d');
            this.frames = [];
            this.loaded = 0;
            this.total = CONFIG.TOTAL_FRAMES;
            this.currentFrame = 0;
            // Auto-play loop fields
            this.autoPlayRaf = null;
            this.autoPlayFrame = 0;
            this.isAutoPlaying = false;
        }

        preload() {
            return new Promise((resolve) => {
                let loadedCount = 0;
                for (let i = 1; i <= this.total; i++) {
                    const img = new Image();
                    const idx = String(i).padStart(3, '0');
                    img.src = `${CONFIG.FRAME_DIR}ezgif-frame-${idx}.jpg`;
                    img.onload = () => {
                        loadedCount++;
                        if (loadedCount === this.total) resolve();
                    };
                    img.onerror = () => {
                        loadedCount++;
                        if (loadedCount === this.total) resolve();
                    };
                    this.frames.push(img);
                }
            });
        }

        resize() {
            const wrap = this.canvas.parentElement;
            const dpr = window.devicePixelRatio || 1;
            this.canvas.width = wrap.clientWidth * dpr;
            this.canvas.height = wrap.clientHeight * dpr;
            this.canvas.style.width = wrap.clientWidth + 'px';
            this.canvas.style.height = wrap.clientHeight + 'px';
            this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            this.drawFrame(this.currentFrame);
        }

        drawFrame(index) {
            if (index < 0 || index >= this.frames.length) return;
            if (!this.frames[index].complete) return;
            this.currentFrame = index;
            const img = this.frames[index];
            const cw = this.canvas.width / (window.devicePixelRatio || 1);
            const ch = this.canvas.height / (window.devicePixelRatio || 1);

            // Cover-fit
            const imgRatio = img.width / img.height;
            const canvasRatio = cw / ch;
            let dw, dh, dx, dy;
            if (canvasRatio > imgRatio) {
                dw = cw; dh = cw / imgRatio;
                dx = 0; dy = (ch - dh) / 2;
            } else {
                dh = ch; dw = ch * imgRatio;
                dx = (cw - dw) / 2; dy = 0;
            }

            this.ctx.clearRect(0, 0, cw, ch);
            this.ctx.drawImage(img, dx, dy, dw, dh);
        }

        setProgress(progress) {
            // progress: 0..1
            const idx = Math.min(Math.floor(progress * this.total), this.total - 1);
            if (idx !== this.currentFrame) {
                this.drawFrame(idx);
            }
        }
    }

    // ═══════════════ APPLICATION ═══════════════
    class App {
        constructor() {
            this.els = {};
            this.solver = null;
            this.solutions = [];
            this.currentSolIndex = 0;
            this.renderer = null;
            this.animController = null;
            this.heroPlayer = null;
            this.state = 'ready'; // ready | running | paused | complete
        }

        init() {
            this._cacheElements();
            this._setupRenderer();
            this._setupHero();
            this._bindEvents();
            this._setupScrollReveal();
            this._setupNavScroll();
        }

        _cacheElements() {
            this.els = {
                navbar: document.getElementById('navbar'),
                heroCanvas: document.getElementById('heroFrameCanvas'),
                chessCanvas: document.getElementById('chessCanvas'),
                boardGlow: document.getElementById('boardGlow'),
                boardOverlay: document.getElementById('boardOverlay'),
                overlayText: document.querySelector('.overlay-text'),
                overlayIcon: document.querySelector('.overlay-icon'),
                queenCount: document.getElementById('queenCount'),
                btnDecN: document.getElementById('btnDecN'),
                btnIncN: document.getElementById('btnIncN'),
                speedSlider: document.getElementById('speedSlider'),
                btnStart: document.getElementById('btnStart'),
                btnPause: document.getElementById('btnPause'),
                btnReset: document.getElementById('btnReset'),
                btnNextSolution: document.getElementById('btnNextSolution'),
                solutionNav: document.getElementById('solutionNav'),
                solutionCounter: document.getElementById('solutionCounter'),
                btnPrevSol: document.getElementById('btnPrevSol'),
                btnNextSol: document.getElementById('btnNextSol'),
                statStatus: document.getElementById('statStatus'),
                statSteps: document.getElementById('statSteps'),
                statSolutions: document.getElementById('statSolutions'),
                statBacktracks: document.getElementById('statBacktracks'),
                solutionsGrid: document.getElementById('solutionsGrid'),
                solutionsPlaceholder: document.getElementById('solutionsPlaceholder'),
                scrollIndicator: document.getElementById('scrollIndicator'),
                mobileToggle: document.getElementById('mobileToggle'),
            };
        }

        _setupRenderer() {
            this.renderer = new BoardRenderer(this.els.chessCanvas);
            const n = parseInt(this.els.queenCount.value) || 8;
            this.renderer.resize(n);
            this.renderer.renderEmpty();

            this.animController = new AnimationController(this.renderer, (event, stats, step) => {
                this._onAnimUpdate(event, stats, step);
            });
        }

        _setupHero() {
            this.heroPlayer = new HeroFramePlayer(this.els.heroCanvas);
            this.heroPlayer.preload().then(() => {
                this.heroPlayer.resize();
                this.heroPlayer.drawFrame(0);
                // Start auto-play loop if user hasn't scrolled
                if (window.scrollY < 10) this._startHeroAutoPlay();
            });
        }

        _startHeroAutoPlay() {
            if (this.heroPlayer.isAutoPlaying) return;
            this.heroPlayer.isAutoPlaying = true;
            this.heroPlayer.autoPlayFrame = 0;
            const rate = 0.15; // frames per tick (~9fps visual feel)
            const loop = () => {
                if (!this.heroPlayer.isAutoPlaying) return;
                this.heroPlayer.autoPlayFrame += rate;
                if (this.heroPlayer.autoPlayFrame >= this.heroPlayer.total) {
                    this.heroPlayer.autoPlayFrame = 0;
                }
                const idx = Math.floor(this.heroPlayer.autoPlayFrame);
                this.heroPlayer.drawFrame(idx);
                this.heroPlayer.autoPlayRaf = requestAnimationFrame(loop);
            };
            this.heroPlayer.autoPlayRaf = requestAnimationFrame(loop);
        }

        _stopHeroAutoPlay() {
            if (this.heroPlayer) {
                this.heroPlayer.isAutoPlaying = false;
                if (this.heroPlayer.autoPlayRaf) {
                    cancelAnimationFrame(this.heroPlayer.autoPlayRaf);
                    this.heroPlayer.autoPlayRaf = null;
                }
            }
        }

        _bindEvents() {
            // N controls
            this.els.btnDecN.addEventListener('click', () => this._changeN(-1));
            this.els.btnIncN.addEventListener('click', () => this._changeN(1));
            this.els.queenCount.addEventListener('change', () => {
                let v = parseInt(this.els.queenCount.value);
                v = Math.max(CONFIG.MIN_N, Math.min(CONFIG.MAX_N, v || 4));
                this.els.queenCount.value = v;
                this._resetSolver();
            });

            // Speed
            this.els.speedSlider.addEventListener('input', () => {
                if (this.animController) {
                    this.animController.speed = parseInt(this.els.speedSlider.value);
                }
            });

            // Solver controls
            this.els.btnStart.addEventListener('click', () => this._start());
            this.els.btnPause.addEventListener('click', () => this._pause());
            this.els.btnReset.addEventListener('click', () => this._resetSolver());
            this.els.btnNextSolution.addEventListener('click', () => this._showNextSolution());

            // Solution navigation
            this.els.btnPrevSol.addEventListener('click', () => this._navigateSolution(-1));
            this.els.btnNextSol.addEventListener('click', () => this._navigateSolution(1));

            // Resize
            window.addEventListener('resize', () => {
                this.renderer.resize();
                if (this.state === 'ready') {
                    this.renderer.renderEmpty();
                }
                if (this.heroPlayer) {
                    this.heroPlayer.resize();
                }
            });

            // Scroll handler
            let ticking = false;
            window.addEventListener('scroll', () => {
                if (!ticking) {
                    requestAnimationFrame(() => {
                        this._onScroll();
                        ticking = false;
                    });
                    ticking = true;
                }
            });

            // Mobile menu
            this.els.mobileToggle.addEventListener('click', () => {
                const links = document.querySelector('.nav-links');
                links.classList.toggle('mobile-open');
                this.els.mobileToggle.classList.toggle('active');
            });
        }

        _changeN(delta) {
            let v = parseInt(this.els.queenCount.value) + delta;
            v = Math.max(CONFIG.MIN_N, Math.min(CONFIG.MAX_N, v));
            this.els.queenCount.value = v;
            this._resetSolver();
        }

        _start() {
            if (this.state === 'paused') {
                // Resume
                this.animController.play();
                this.state = 'running';
                this._updateUI();
                return;
            }

            const n = parseInt(this.els.queenCount.value);
            this.solver = new NQueensSolver(n);
            const result = this.solver.solve();
            this.solutions = result.solutions;

            this.renderer.resize(n);
            this.animController.setSteps(result.steps);
            this.animController.speed = parseInt(this.els.speedSlider.value);

            this.els.boardOverlay.classList.add('hidden');
            this.els.boardGlow.classList.remove('active', 'solution');
            this.els.boardGlow.classList.add('active');
            this.state = 'running';
            this._updateUI();
            this.animController.play();
        }

        _pause() {
            if (this.state === 'running') {
                this.animController.pause();
                this.state = 'paused';
                this._updateUI();
            }
        }

        _resetSolver() {
            if (this.animController) {
                this.animController.reset();
            }
            const n = parseInt(this.els.queenCount.value);
            this.renderer.resize(n);
            this.renderer.renderEmpty();
            this.solutions = [];
            this.currentSolIndex = 0;
            this.state = 'ready';

            this.els.boardOverlay.classList.remove('hidden');
            this.els.overlayText.textContent = 'Press Start to begin';
            this.els.overlayIcon.textContent = '♛';
            this.els.boardGlow.classList.remove('active', 'solution');

            this.els.statStatus.textContent = 'Ready';
            this.els.statSteps.textContent = '0';
            this.els.statSolutions.textContent = '0';
            this.els.statBacktracks.textContent = '0';

            this.els.solutionNav.style.display = 'none';

            // Clear solutions grid
            this.els.solutionsGrid.innerHTML = '';
            this.els.solutionsGrid.appendChild(this.els.solutionsPlaceholder);
            this.els.solutionsPlaceholder.style.display = 'flex';

            this._updateUI();
        }

        _showNextSolution() {
            if (this.solutions.length === 0) return;
            this.currentSolIndex = 0;
            this._displaySolution(this.currentSolIndex);
            this.els.solutionNav.style.display = 'flex';
            this._updateSolutionCounter();
        }

        _navigateSolution(delta) {
            if (this.solutions.length === 0) return;
            this.currentSolIndex = (this.currentSolIndex + delta + this.solutions.length) % this.solutions.length;
            this._displaySolution(this.currentSolIndex);
            this._updateSolutionCounter();
        }

        _displaySolution(index) {
            const sol = this.solutions[index];
            this.renderer.renderSolution(sol);
            this.els.boardGlow.classList.add('solution');

            // Highlight in gallery
            document.querySelectorAll('.solution-thumb').forEach((el, i) => {
                el.classList.toggle('active', i === index);
            });
        }

        _updateSolutionCounter() {
            this.els.solutionCounter.textContent = `${this.currentSolIndex + 1} / ${this.solutions.length}`;
        }

        _onAnimUpdate(event, stats, step) {
            this.els.statSteps.textContent = stats.steps.toLocaleString();
            this.els.statSolutions.textContent = stats.solutions;
            this.els.statBacktracks.textContent = stats.backtracks.toLocaleString();

            if (event === 'step' && step) {
                const statusEl = this.els.statStatus;
                statusEl.textContent =
                    step.type === 'try' ? `Trying (${step.row}, ${step.col})` :
                        step.type === 'place' ? `Placed at (${step.row}, ${step.col})` :
                            step.type === 'conflict' ? `Conflict at (${step.row}, ${step.col})` :
                                step.type === 'remove' ? `Backtracking row ${step.row}` :
                                    step.type === 'solution' ? `Solution #${step.index} found!` :
                                        'Solving...';

                // Color-code the status text
                statusEl.setAttribute('data-state',
                    step.type === 'conflict' ? 'conflict' :
                        step.type === 'solution' ? 'solution' :
                            step.type === 'place' ? 'place' :
                                step.type === 'remove' ? 'backtrack' : '');

                if (step.type === 'solution') {
                    this.els.boardGlow.classList.add('solution');
                    // Show celebration overlay briefly
                    this._showCelebration(step.index);
                } else {
                    this.els.boardGlow.classList.remove('solution');
                }
            }

            if (event === 'complete') {
                this.state = 'complete';
                this.els.statStatus.textContent = `Complete — ${stats.solutions} solution${stats.solutions !== 1 ? 's' : ''}`;
                this.els.statStatus.setAttribute('data-state', 'solution');
                this.els.boardGlow.classList.add('solution');

                if (this.solutions.length > 0) {
                    this.renderer.renderSolution(this.solutions[0]);
                    this.currentSolIndex = 0;
                    this.els.solutionNav.style.display = 'flex';
                    this._updateSolutionCounter();
                    this._buildSolutionsGallery();
                }

                this._updateUI();
            }
        }

        _showCelebration(solutionNum) {
            const overlay = this.els.boardOverlay;
            const icon = this.els.overlayIcon;
            const text = this.els.overlayText;

            overlay.classList.remove('hidden');
            overlay.classList.add('celebration');
            icon.textContent = '♛';
            text.textContent = `Solution #${solutionNum} Found!`;

            // Auto-hide after delay
            setTimeout(() => {
                overlay.classList.add('hidden');
                overlay.classList.remove('celebration');
            }, 1200);
        }

        _buildSolutionsGallery() {
            const grid = this.els.solutionsGrid;
            grid.innerHTML = '';
            this.els.solutionsPlaceholder.style.display = 'none';

            const maxShow = Math.min(this.solutions.length, 60);
            for (let i = 0; i < maxShow; i++) {
                const thumb = document.createElement('div');
                thumb.className = 'solution-thumb' + (i === 0 ? ' active' : '');
                const cvs = document.createElement('canvas');
                thumb.appendChild(cvs);
                const label = document.createElement('span');
                label.className = 'solution-thumb-label';
                label.textContent = `#${i + 1}`;
                thumb.appendChild(label);

                thumb.addEventListener('click', () => {
                    this.currentSolIndex = i;
                    this._displaySolution(i);
                    this._updateSolutionCounter();
                });

                grid.appendChild(thumb);

                // Render mini board
                const n = parseInt(this.els.queenCount.value);
                requestAnimationFrame(() => {
                    const mini = new MiniBoardRenderer(cvs, n);
                    mini.render(this.solutions[i]);
                });
            }

            if (this.solutions.length > maxShow) {
                const more = document.createElement('div');
                more.className = 'solutions-placeholder';
                more.style.gridColumn = '1 / -1';
                more.style.padding = '20px';
                more.innerHTML = `<p style="color:var(--text-muted)">+ ${this.solutions.length - maxShow} more solutions</p>`;
                grid.appendChild(more);
            }
        }

        _updateUI() {
            const isReady = this.state === 'ready';
            const isRunning = this.state === 'running';
            const isPaused = this.state === 'paused';
            const isComplete = this.state === 'complete';

            // Start button
            if (isPaused) {
                this.els.btnStart.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>
                    Resume`;
            } else {
                this.els.btnStart.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>
                    Start Visualization`;
            }

            this.els.btnStart.disabled = isRunning;
            this.els.btnPause.disabled = !isRunning;
            this.els.btnNextSolution.disabled = !(isComplete && this.solutions.length > 0);
            this.els.queenCount.disabled = isRunning;
            this.els.btnDecN.disabled = isRunning;
            this.els.btnIncN.disabled = isRunning;
        }

        _onScroll() {
            const scrollY = window.scrollY;

            // Navbar scroll effect
            this.els.navbar.classList.toggle('scrolled', scrollY > 50);

            // Hero frame scrub — stop autoplay when user scrolls
            const heroSection = document.getElementById('hero');
            const heroH = heroSection.offsetHeight;
            if (scrollY > 10 && this.heroPlayer && this.heroPlayer.isAutoPlaying) {
                this._stopHeroAutoPlay();
            }
            if (scrollY < heroH && this.heroPlayer && this.heroPlayer.frames.length > 0) {
                if (!this.heroPlayer.isAutoPlaying) {
                    const progress = Math.min(scrollY / (heroH * 0.8), 1);
                    this.heroPlayer.setProgress(progress);
                }
            }

            // Scroll indicator fade
            if (this.els.scrollIndicator) {
                this.els.scrollIndicator.style.opacity = Math.max(0, 1 - scrollY / 200);
            }

            // Active nav link
            const sections = ['problem', 'algorithm', 'tryit', 'solutions'];
            let activeId = '';
            for (const id of sections) {
                const el = document.getElementById(id);
                if (el && el.offsetTop - 200 <= scrollY) {
                    activeId = id;
                }
            }
            document.querySelectorAll('.nav-link').forEach(link => {
                link.classList.toggle('active', link.dataset.section === activeId);
            });
        }

        _setupScrollReveal() {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');
                    }
                });
            }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

            document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
        }

        _setupNavScroll() {
            document.querySelectorAll('.nav-link, .nav-cta, .hero-actions a').forEach(link => {
                link.addEventListener('click', (e) => {
                    const href = link.getAttribute('href');
                    if (href && href.startsWith('#')) {
                        e.preventDefault();
                        const target = document.querySelector(href);
                        if (target) {
                            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                        // Close mobile menu
                        document.querySelector('.nav-links')?.classList.remove('mobile-open');
                    }
                });
            });
        }
    }

    // ═══════════════ BOOT ═══════════════
    document.addEventListener('DOMContentLoaded', () => {
        const app = new App();
        app.init();
    });

})();
