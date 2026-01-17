/* ch5- Greedy Algorithms/script.js */

class StepPlayer {
    constructor(renderCallback, onStepChange) {
        this.steps = [];
        this.currentStep = 0;
        this.isPlaying = false;
        this.timer = null;
        this.speed = 1000;
        this.renderCallback = renderCallback; // Function to draw/update DOM based on state
        this.onStepChange = onStepChange;     // Function to update texts/controls

        // Bind controls
        this.btnPrev = document.getElementById('btnPrev');
        this.btnNext = document.getElementById('btnNext');
        this.btnPlay = document.getElementById('btnPlay');
        this.btnReset = document.getElementById('btnReset');
        this.speedInput = document.getElementById('speedRange');
        
        if(this.btnPrev) this.btnPrev.addEventListener('click', () => this.prev());
        if(this.btnNext) this.btnNext.addEventListener('click', () => this.next());
        if(this.btnPlay) this.btnPlay.addEventListener('click', () => this.togglePlay());
        if(this.btnReset) this.btnReset.addEventListener('click', () => this.reset());
        if(this.speedInput) {
            this.speedInput.addEventListener('input', (e) => {
                this.speed = 2000 - parseInt(e.target.value); // Invert: High value = Low ms
            });
        }
    }

    setSteps(newSteps) {
        this.steps = newSteps;
        this.currentStep = 0;
        this.pause();
        this.updateUI();
    }

    updateUI() {
        if (this.steps.length === 0) return;

        // Clamp index
        if(this.currentStep < 0) this.currentStep = 0;
        if(this.currentStep >= this.steps.length) this.currentStep = this.steps.length - 1;

        const step = this.steps[this.currentStep];

        // Render visualization
        if(this.renderCallback) this.renderCallback(step.state, step);

        // Update Text Info
        const descEl = document.getElementById('step-desc');
        if(descEl) descEl.innerHTML = step.description;

        const counterEl = document.getElementById('step-counter');
        if(counterEl) counterEl.innerText = `${this.currentStep + 1} / ${this.steps.length}`;

        // Highlight Code
        document.querySelectorAll('.code-line').forEach(el => el.classList.remove('active'));
        if(step.codeLine !== undefined && step.codeLine !== null) {
            const line = document.getElementById(`line-${step.codeLine}`);
            if(line) line.classList.add('active');
        }

        // Button States
        if(this.btnPrev) this.btnPrev.disabled = this.currentStep === 0;
        if(this.btnNext) this.btnNext.disabled = this.currentStep === this.steps.length - 1;
        
        // Callback
        if(this.onStepChange) this.onStepChange(this.currentStep);
    }

    next() {
        if (this.currentStep < this.steps.length - 1) {
            this.currentStep++;
            this.updateUI();
        } else {
            this.pause();
        }
    }

    prev() {
        if (this.currentStep > 0) {
            this.currentStep--;
            this.updateUI();
        }
    }

    togglePlay() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }

    play() {
        if(this.currentStep >= this.steps.length - 1) {
            this.currentStep = 0; // Restart if at end
        }
        this.isPlaying = true;
        if(this.btnPlay) this.btnPlay.innerHTML = "⏸ Pause";
        
        this.timer = setInterval(() => {
            if(this.currentStep < this.steps.length - 1) {
                this.next();
            } else {
                this.pause();
            }
        }, this.speed);
    }

    pause() {
        this.isPlaying = false;
        clearInterval(this.timer);
        if(this.btnPlay) this.btnPlay.innerHTML = "▶ Play";
    }

    reset() {
        this.pause();
        this.currentStep = 0;
        this.updateUI();
    }
}

// Common Utils
function createSVGElement(type, attributes) {
    const el = document.createElementNS("http://www.w3.org/2000/svg", type);
    for (let key in attributes) {
        el.setAttribute(key, attributes[key]);
    }
    return el;
}

// Draggable Pseudocode Card and Options Card
document.addEventListener('DOMContentLoaded', () => {
    function makeDraggable(card) {
        if (!card) return;

        let isDraggingCard = false;
        let startX, startY, initialLeft, initialTop;

        card.addEventListener('mousedown', (e) => {
            if(e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT' || 
               e.target.tagName === 'STRONG' || e.target.closest('.candidate-item') ||
               e.target.closest('.update-item')) return;

            isDraggingCard = true;
            startX = e.clientX;
            startY = e.clientY;
            
            const rect = card.getBoundingClientRect();
            const parentRect = card.offsetParent ? card.offsetParent.getBoundingClientRect() : { left: 0, top: 0 };

            card.style.bottom = 'auto';
            card.style.right = 'auto';
            
            const relativeLeft = rect.left - parentRect.left;
            const relativeTop = rect.top - parentRect.top;

            card.style.left = relativeLeft + 'px';
            card.style.top = relativeTop + 'px';
            
            initialLeft = relativeLeft;
            initialTop = relativeTop;
            
            card.style.opacity = '0.8';
            card.style.zIndex = '1000';
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDraggingCard) return;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            card.style.left = (initialLeft + dx) + 'px';
            card.style.top = (initialTop + dy) + 'px';
        });

        document.addEventListener('mouseup', () => {
            if (isDraggingCard) {
                isDraggingCard = false;
                card.style.opacity = '1';
            }
        });
    }

    makeDraggable(document.querySelector('.pseudocode-container'));
    makeDraggable(document.querySelector('.options-container'));
});
