// Global navigation function
function showAlgorithm(algoName) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    
    // Show selected algorithm page
    const section = document.getElementById(algoName);
    if (section) {
        section.classList.add('active');
    }
    
    // Update nav
    const navLink = document.querySelector(`a[href="#algorithms"]`);
    if (navLink) navLink.classList.add('active');
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Navigation setup and Theme management
document.addEventListener('DOMContentLoaded', function() {
    // Theme Management
    const themeToggleBtn = document.getElementById('theme-toggle');
    
    // Check for saved theme
    const savedTheme = getCookie('theme');
    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
        updateThemeButtonText(savedTheme);
    } else {
        // Check system preference
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.documentElement.setAttribute('data-theme', 'dark');
            updateThemeButtonText('dark');
        }
    }
    
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', function() {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            document.documentElement.setAttribute('data-theme', newTheme);
            setCookie('theme', newTheme, 365);
            updateThemeButtonText(newTheme);
        });
    }

    function updateThemeButtonText(theme) {
        if (themeToggleBtn) {
            themeToggleBtn.textContent = theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme';
        }
    }

    function setCookie(cname, cvalue, exdays) {
        const d = new Date();
        d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
        let expires = "expires="+d.toUTCString();
        document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
    }

    function getCookie(cname) {
        let name = cname + "=";
        let ca = document.cookie.split(';');
        for(let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) == ' ') {
                c = c.substring(1);
            }
            if (c.indexOf(name) == 0) {
                return c.substring(name.length, c.length);
            }
        }
        return "";
    }

    // Navigation Logic
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.section');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            
            navLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            
            sections.forEach(s => s.classList.remove('active'));
            const target = document.getElementById(targetId);
            if (target) {
                target.classList.add('active');
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    });
    
    // Show home by default
    document.getElementById('home').classList.add('active');
});

// ==================== ACTIVITY SELECTION ALGORITHM ====================
let activityData = {
    activities: [],
    sorted: [],
    selected: [],
    currentStep: 0,
    steps: [],
    autoRunning: false,
    autoInterval: null
};

function activityRandom() {
    activityData.activities = [];
    const count = Math.floor(Math.random() * 8) + 5; // 5-12 activities
    const maxTime = 30;
    
    for (let i = 0; i < count; i++) {
        const start = Math.floor(Math.random() * (maxTime - 3));
        const end = start + Math.floor(Math.random() * 10) + 2;
        activityData.activities.push({
            id: i,
            start: start,
            end: Math.min(end, maxTime),
            label: String.fromCharCode(65 + i) // A, B, C, ...
        });
    }
    
    activityReset();
    activityPrepareSteps();
    drawActivitySelection();
}

function activityReset() {
    activityData.currentStep = 0;
    activityData.sorted = [];
    activityData.selected = [];
    activityData.steps = [];
    activityData.autoRunning = false;
    if (activityData.autoInterval) {
        clearInterval(activityData.autoInterval);
        activityData.autoInterval = null;
    }
    updateActivityControls();
    updateActivityExplanation('Ready to start. Click "Next Step" to begin.');
}

function activityPrepareSteps() {
    activityData.steps = [];
    
    // Step 1: Show activities
    activityData.steps.push({
        type: 'show_activities',
        explanation: 'Here are the activities. Each activity has a start and end time.'
    });
    
    // Step 2: Sort activities
    activityData.sorted = [...activityData.activities].sort((a, b) => a.end - b.end);
    activityData.steps.push({
        type: 'sort',
        explanation: 'Sorting activities by finishing time (earliest finish first).'
    });
    
    // Step 3: Select first activity
    let lastFinish = -1;
    activityData.selected = [];
    
    for (let i = 0; i < activityData.sorted.length; i++) {
        const act = activityData.sorted[i];
        if (act.start >= lastFinish) {
            activityData.selected.push(i);
            lastFinish = act.end;
            activityData.steps.push({
                type: 'select',
                index: i,
                activity: act,
                explanation: `Selecting activity ${act.label} (${act.start}-${act.end}) because it starts after the previous selection finishes.`
            });
        } else {
            activityData.steps.push({
                type: 'skip',
                index: i,
                activity: act,
                explanation: `Skipping activity ${act.label} (${act.start}-${act.end}) because it overlaps with previous selection.`
            });
        }
    }
    
    // Final step
    activityData.steps.push({
        type: 'complete',
        explanation: `Algorithm complete! Selected ${activityData.selected.length} activities: ${activityData.selected.map(i => activityData.sorted[i].label).join(', ')}`
    });
    
    document.getElementById('activity-total-steps').textContent = activityData.steps.length;
    activityData.currentStep = 0;
    updateActivityControls();
}

function activityNextStep() {
    if (activityData.currentStep < activityData.steps.length) {
        executeActivityStep(activityData.currentStep);
        activityData.currentStep++;
        updateActivityControls();
    }
}

function activityPrevStep() {
    if (activityData.currentStep > 0) {
        activityData.currentStep--;
        activityReset();
        for (let i = 0; i < activityData.currentStep; i++) {
            executeActivityStep(i);
        }
        updateActivityControls();
    }
}

function executeActivityStep(stepIndex) {
    if (stepIndex >= activityData.steps.length) return;
    
    const step = activityData.steps[stepIndex];
    updateActivityExplanation(step.explanation);
    
    drawActivitySelection();
    
    if (step.type === 'sort') {
        // Highlight sorted order
        activityData.sorted.forEach((act, idx) => {
            setTimeout(() => {
                highlightActivity(act.id, 'processing');
            }, idx * 100);
        });
    } else if (step.type === 'select') {
        highlightActivity(step.activity.id, 'selected');
        activityData.selected.push(step.index);
    } else if (step.type === 'skip') {
        highlightActivity(step.activity.id, 'skipped');
    }
    
    document.getElementById('activity-step-count').textContent = stepIndex + 1;
}

function activityAutoRun() {
    if (activityData.autoRunning) {
        // Stop auto-run
        activityData.autoRunning = false;
        if (activityData.autoInterval) {
            clearInterval(activityData.autoInterval);
            activityData.autoInterval = null;
        }
        document.getElementById('activity-auto').textContent = 'Auto Run All';
        document.getElementById('activity-auto').classList.remove('running');
    } else {
        // Start auto-run
        if (activityData.currentStep >= activityData.steps.length) {
            activityReset();
        }
        activityData.autoRunning = true;
        document.getElementById('activity-auto').textContent = 'Stop';
        document.getElementById('activity-auto').classList.add('running');
        
        activityData.autoInterval = setInterval(() => {
            if (activityData.currentStep < activityData.steps.length) {
                activityNextStep();
            } else {
                activityAutoRun(); // Stop when done
            }
        }, 1500);
    }
}

function updateActivityControls() {
    const prevBtn = document.getElementById('activity-prev');
    const nextBtn = document.getElementById('activity-next');
    const autoBtn = document.getElementById('activity-auto');
    
    prevBtn.disabled = activityData.currentStep === 0;
    nextBtn.disabled = activityData.currentStep >= activityData.steps.length;
    
    if (activityData.currentStep >= activityData.steps.length) {
        autoBtn.disabled = true;
        autoBtn.classList.remove('running');
        autoBtn.textContent = 'Auto Run All';
    } else {
        autoBtn.disabled = false;
    }
}

function updateActivityExplanation(text) {
    document.getElementById('activity-explanation').textContent = text;
}

function highlightActivity(id, type) {
    // This will be handled in drawActivitySelection
}

function drawActivitySelection() {
    const canvas = document.getElementById('activityCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (activityData.activities.length === 0) {
        ctx.fillStyle = '#7f8c8d';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Click "Generate Random" to start', canvas.width / 2, canvas.height / 2);
        return;
    }
    
    const maxTime = Math.max(...activityData.activities.map(a => a.end));
    const padding = 60;
    const timeScale = (canvas.width - 2 * padding) / (maxTime + 5);
    const barHeight = 30;
    const barSpacing = 40;
    const startY = 80;
    
    // Draw timeline
    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-color').trim();
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding, 50);
    ctx.lineTo(canvas.width - padding, 50);
    ctx.stroke();
    
    // Draw time markers
    for (let t = 0; t <= maxTime; t += 5) {
        const x = padding + t * timeScale;
        ctx.beginPath();
        ctx.moveTo(x, 45);
        ctx.lineTo(x, 55);
        ctx.stroke();
        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-color').trim();
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(t.toString(), x, 65);
    }
    
    // Determine which activities to show (sorted or original)
    const activitiesToShow = activityData.sorted.length > 0 ? activityData.sorted : activityData.activities;
    const currentStep = activityData.steps[activityData.currentStep];
    
    activitiesToShow.forEach((act, idx) => {
        const x = padding + act.start * timeScale;
        const width = (act.end - act.start) * timeScale;
        const y = startY + idx * barSpacing;
        
        // Determine color based on state
        let color = '#95a5a6';
        let strokeColor = '#7f8c8d';
        let strokeWidth = 1;
        
        if (currentStep) {
            if (currentStep.type === 'select' && currentStep.index === idx) {
                color = '#27ae60';
                strokeColor = '#229954';
                strokeWidth = 3;
            } else if (currentStep.type === 'skip' && currentStep.index === idx) {
                color = '#e74c3c';
                strokeColor = '#c0392b';
                strokeWidth = 2;
            } else if (activityData.selected.includes(idx)) {
                color = '#3498db';
                strokeColor = '#2980b9';
                strokeWidth = 2;
            }
        } else if (activityData.selected.includes(idx)) {
            color = '#3498db';
            strokeColor = '#2980b9';
            strokeWidth = 2;
        }
        
        // Draw activity bar
        ctx.fillStyle = color;
        ctx.fillRect(x, y, width, barHeight);
        
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = strokeWidth;
        ctx.strokeRect(x, y, width, barHeight);
        
        // Draw label
        ctx.fillStyle = 'white';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(act.label, x + width / 2, y + barHeight / 2 + 5);
        
        // Draw time labels
        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-color').trim();
        ctx.font = '11px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`${act.start}`, x - 15, y + barHeight / 2 + 4);
        ctx.textAlign = 'right';
        ctx.fillText(`${act.end}`, x + width + 15, y + barHeight / 2 + 4);
    });
}

// ==================== FRACTIONAL KNAPSACK ALGORITHM ====================
let knapsackData = {
    items: [],
    sorted: [],
    selected: [],
    capacity: 50,
    currentStep: 0,
    steps: [],
    autoRunning: false,
    autoInterval: null,
    currentWeight: 0,
    totalValue: 0
};

function knapsackRandom() {
    knapsackData.items = [];
    const count = Math.floor(Math.random() * 6) + 4; // 4-9 items
    knapsackData.capacity = Math.floor(Math.random() * 80) + 30; // 30-110
    
    for (let i = 0; i < count; i++) {
        const value = Math.floor(Math.random() * 150) + 20;
        const weight = Math.floor(Math.random() * 40) + 5;
        knapsackData.items.push({
            id: i,
            value: value,
            weight: weight,
            ratio: value / weight,
            label: String.fromCharCode(65 + i)
        });
    }
    
    knapsackReset();
    knapsackPrepareSteps();
    drawKnapsack();
}

function knapsackReset() {
    knapsackData.currentStep = 0;
    knapsackData.sorted = [];
    knapsackData.selected = [];
    knapsackData.steps = [];
    knapsackData.autoRunning = false;
    knapsackData.currentWeight = 0;
    knapsackData.totalValue = 0;
    if (knapsackData.autoInterval) {
        clearInterval(knapsackData.autoInterval);
        knapsackData.autoInterval = null;
    }
    updateKnapsackControls();
    updateKnapsackExplanation('Ready to start. Click "Next Step" to begin.');
    drawKnapsack();
}

function knapsackPrepareSteps() {
    knapsackData.steps = [];
    
    // Step 1: Show items
    knapsackData.steps.push({
        type: 'show_items',
        explanation: `Here are ${knapsackData.items.length} items. Capacity: ${knapsackData.capacity}`
    });
    
    // Step 2: Calculate ratios
    knapsackData.items.forEach(item => {
        knapsackData.steps.push({
            type: 'calculate_ratio',
            item: item,
            explanation: `Item ${item.label}: Value=${item.value}, Weight=${item.weight}, Ratio=${item.ratio.toFixed(2)}`
        });
    });
    
    // Step 3: Sort by ratio
    knapsackData.sorted = [...knapsackData.items].sort((a, b) => b.ratio - a.ratio);
    knapsackData.steps.push({
        type: 'sort',
        explanation: 'Sorting items by value/weight ratio (descending order).'
    });
    
    // Step 4: Select items greedily
    let tempCurrentWeight = 0;
    let tempTotalValue = 0;
    
    for (let i = 0; i < knapsackData.sorted.length; i++) {
        const item = knapsackData.sorted[i];
        const remaining = knapsackData.capacity - tempCurrentWeight;
        
        if (remaining <= 0) break;
        
        if (item.weight <= remaining) {
            // Take whole item
            tempCurrentWeight += item.weight;
            tempTotalValue += item.value;
            knapsackData.steps.push({
                type: 'take_whole',
                item: item,
                fraction: 1,
                value: item.value,
                weight: item.weight,
                currentWeight: tempCurrentWeight,
                totalValue: tempTotalValue,
                explanation: `Taking 100% of Item ${item.label} (Value: ${item.value}, Weight: ${item.weight}). Remaining capacity: ${knapsackData.capacity - tempCurrentWeight}`
            });
        } else {
            // Take fraction
            const fraction = remaining / item.weight;
            const value = item.value * fraction;
            const weight = remaining;
            tempCurrentWeight += weight;
            tempTotalValue += value;
            knapsackData.steps.push({
                type: 'take_fraction',
                item: item,
                fraction: fraction,
                value: value,
                weight: weight,
                currentWeight: tempCurrentWeight,
                totalValue: tempTotalValue,
                explanation: `Taking ${(fraction * 100).toFixed(1)}% of Item ${item.label} (Value: ${value.toFixed(2)}, Weight: ${weight.toFixed(2)}). Capacity full!`
            });
            break;
        }
    }
    
    // Final step
    knapsackData.steps.push({
        type: 'complete',
        explanation: `Algorithm complete! Total Value: ${tempTotalValue.toFixed(2)}, Weight Used: ${tempCurrentWeight.toFixed(2)}/${knapsackData.capacity}`
    });
    
    document.getElementById('knapsack-total-steps').textContent = knapsackData.steps.length;
    knapsackData.currentStep = 0;
    updateKnapsackControls();
}

function knapsackNextStep() {
    if (knapsackData.currentStep < knapsackData.steps.length) {
        executeKnapsackStep(knapsackData.currentStep);
        knapsackData.currentStep++;
        updateKnapsackControls();
    }
}

function knapsackPrevStep() {
    if (knapsackData.currentStep > 0) {
        knapsackData.currentStep--;
        const targetStep = knapsackData.currentStep;
        
        // Fully reset state
        knapsackData.currentStep = 0;
        knapsackData.selected = [];
        knapsackData.currentWeight = 0;
        knapsackData.totalValue = 0;
        
        // Re-execute steps up to target
        for (let i = 0; i < targetStep; i++) {
            executeKnapsackStep(i);
            knapsackData.currentStep++;
        }
        
        // Draw final state
        drawKnapsack();
        updateKnapsackControls();
        document.getElementById('knapsack-step-count').textContent = targetStep; // Correctly display step count
    }
}

function executeKnapsackStep(stepIndex) {
    if (stepIndex >= knapsackData.steps.length) return;
    
    const step = knapsackData.steps[stepIndex];
    updateKnapsackExplanation(step.explanation);
    
    if (step.type === 'take_whole' || step.type === 'take_fraction') {
        knapsackData.selected.push({
            item: step.item,
            fraction: step.fraction,
            value: step.value,
            weight: step.weight
        });
        knapsackData.currentWeight = step.currentWeight;
        knapsackData.totalValue = step.totalValue;
    }
    
    drawKnapsack();
    document.getElementById('knapsack-step-count').textContent = stepIndex + 1;
}

function knapsackAutoRun() {
    if (knapsackData.autoRunning) {
        knapsackData.autoRunning = false;
        if (knapsackData.autoInterval) {
            clearInterval(knapsackData.autoInterval);
            knapsackData.autoInterval = null;
        }
        document.getElementById('knapsack-auto').textContent = 'Auto Run All';
        document.getElementById('knapsack-auto').classList.remove('running');
    } else {
        if (knapsackData.currentStep >= knapsackData.steps.length) {
            knapsackReset();
        }
        knapsackData.autoRunning = true;
        document.getElementById('knapsack-auto').textContent = 'Stop';
        document.getElementById('knapsack-auto').classList.add('running');
        
        knapsackData.autoInterval = setInterval(() => {
            if (knapsackData.currentStep < knapsackData.steps.length) {
                knapsackNextStep();
            } else {
                knapsackAutoRun();
            }
        }, 1500);
    }
}

function updateKnapsackControls() {
    const prevBtn = document.getElementById('knapsack-prev');
    const nextBtn = document.getElementById('knapsack-next');
    const autoBtn = document.getElementById('knapsack-auto');
    
    prevBtn.disabled = knapsackData.currentStep === 0;
    nextBtn.disabled = knapsackData.currentStep >= knapsackData.steps.length;
    
    if (knapsackData.currentStep >= knapsackData.steps.length) {
        autoBtn.disabled = true;
        autoBtn.classList.remove('running');
        autoBtn.textContent = 'Auto Run All';
    } else {
        autoBtn.disabled = false;
    }
}

function updateKnapsackExplanation(text) {
    document.getElementById('knapsack-explanation').textContent = text;
}

function drawKnapsack() {
    const canvas = document.getElementById('knapsackCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (knapsackData.items.length === 0) {
        ctx.fillStyle = '#7f8c8d';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Click "Generate Random" to start', canvas.width / 2, canvas.height / 2);
        return;
    }
    
    const itemsToShow = knapsackData.sorted.length > 0 ? knapsackData.sorted : knapsackData.items;
    const padding = 50;
    const barWidth = 150;
    const barSpacing = 180;
    const startX = 80;
    const maxRatio = Math.max(...itemsToShow.map(i => i.ratio));
    const maxHeight = 200;
    const baseY = 400;
    
    // Draw capacity bar
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--bg-color').trim();
    ctx.fillRect(padding, 50, canvas.width - 2 * padding, 30);
    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-color').trim();
    ctx.lineWidth = 2;
    ctx.strokeRect(padding, 50, canvas.width - 2 * padding, 30);
    
    const usedWidth = ((canvas.width - 2 * padding) * knapsackData.currentWeight) / knapsackData.capacity;
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--secondary-color').trim();
    ctx.fillRect(padding, 50, usedWidth, 30);
    
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-color').trim();
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Capacity: ${knapsackData.currentWeight.toFixed(1)}/${knapsackData.capacity}`, canvas.width / 2, 70);
    ctx.fillText(`Total Value: ${knapsackData.totalValue.toFixed(2)}`, canvas.width / 2, 95);
    
    // Draw items
    itemsToShow.forEach((item, idx) => {
        const x = startX + idx * barSpacing;
        if (x + barWidth > canvas.width - padding) return;
        
        const height = (item.ratio / maxRatio) * maxHeight;
        const y = baseY - height;
        
        // Check if selected
        const selected = knapsackData.selected.find(s => s.item.id === item.id);
        let color = '#95a5a6';
        let strokeColor = '#7f8c8d';
        let strokeWidth = 1;
        
        if (selected) {
            color = selected.fraction === 1 ? '#27ae60' : '#f39c12';
            strokeColor = selected.fraction === 1 ? '#229954' : '#e67e22';
            strokeWidth = 3;
        }
        
        // Draw bar
        ctx.fillStyle = color;
        ctx.fillRect(x, y, barWidth, height);
        
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = strokeWidth;
        ctx.strokeRect(x, y, barWidth, height);
        
        // Draw item info
        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-color').trim();
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`Item ${item.label}`, x + barWidth / 2, y - 10);
        
        ctx.font = '12px Arial';
        ctx.fillText(`V: ${item.value}`, x + barWidth / 2, y - 40);
        ctx.fillText(`W: ${item.weight}`, x + barWidth / 2, y - 55);
        ctx.fillText(`R: ${item.ratio.toFixed(2)}`, x + barWidth / 2, y - 70);
        
        if (selected) {
            ctx.fillStyle = selected.fraction === 1 ? '#27ae60' : '#f39c12';
            ctx.font = 'bold 14px Arial';
            ctx.fillText(`${(selected.fraction * 100).toFixed(0)}%`, x + barWidth / 2, baseY + 20);
        }
    });
}

// ==================== PRIM'S ALGORITHM ====================
let primsData = {
    vertices: [],
    edges: [],
    mst: [],
    inMST: [],
    key: {},
    parent: {},
    currentStep: 0,
    steps: [],
    autoRunning: false,
    autoInterval: null
};

function primsRandom() {
    primsData.vertices = [];
    primsData.edges = [];
    const vertexCount = Math.floor(Math.random() * 5) + 5; // 5-9 vertices
    
    // Generate vertices in circular layout
    const centerX = 450;
    const centerY = 300;
    const radius = 200;
    
    for (let i = 0; i < vertexCount; i++) {
        const angle = (2 * Math.PI * i) / vertexCount;
        primsData.vertices.push({
            id: i,
            label: String.fromCharCode(65 + i),
            x: centerX + radius * Math.cos(angle),
            y: centerY + radius * Math.sin(angle)
        });
    }
    
    // Generate random edges
    for (let i = 0; i < vertexCount; i++) {
        for (let j = i + 1; j < vertexCount; j++) {
            if (Math.random() > 0.5) { // 50% chance of edge
                const weight = Math.floor(Math.random() * 20) + 1;
                primsData.edges.push({
                    from: i,
                    to: j,
                    weight: weight
                });
            }
        }
    }
    
    primsReset();
    primsPrepareSteps();
    drawPrims();
}

function primsReset() {
    primsData.currentStep = 0;
    primsData.mst = [];
    primsData.inMST = [];
    primsData.key = {};
    primsData.parent = {};
    primsData.steps = [];
    primsData.autoRunning = false;
    if (primsData.autoInterval) {
        clearInterval(primsData.autoInterval);
        primsData.autoInterval = null;
    }
    updatePrimsControls();
    updatePrimsExplanation('Ready to start. Click "Next Step" to begin.');
}

function primsPrepareSteps() {
    primsData.steps = [];
    primsData.key = {};
    primsData.parent = {};
    primsData.inMST = [];
    
    // Initialize keys
    primsData.vertices.forEach(v => {
        primsData.key[v.id] = Infinity;
        primsData.parent[v.id] = null;
    });
    
    primsData.steps.push({
        type: 'init',
        explanation: 'Initializing key values as infinity for all vertices.'
    });
    
    // Start with vertex 0
    primsData.key[0] = 0;
    primsData.steps.push({
        type: 'start',
        vertex: primsData.vertices[0],
        explanation: `Starting with vertex ${primsData.vertices[0].label} (key = 0).`
    });
    
    // Build MST
    while (primsData.inMST.length < primsData.vertices.length) {
        // Find vertex with minimum key not in MST
        let minKey = Infinity;
        let minVertex = null;
        
        primsData.vertices.forEach(v => {
            if (!primsData.inMST.includes(v.id) && primsData.key[v.id] < minKey) {
                minKey = primsData.key[v.id];
                minVertex = v;
            }
        });
        
        if (!minVertex) break;
        
        primsData.inMST.push(minVertex.id);
        primsData.steps.push({
            type: 'add_vertex',
            vertex: minVertex,
            explanation: `Adding vertex ${minVertex.label} to MST (minimum key = ${primsData.key[minVertex.id]}).`
        });
        
        if (primsData.parent[minVertex.id] !== null) {
            primsData.mst.push({
                from: primsData.parent[minVertex.id],
                to: minVertex.id,
                weight: primsData.key[minVertex.id]
            });
            primsData.steps.push({
                type: 'add_edge',
                from: primsData.parent[minVertex.id],
                to: minVertex.id,
                weight: primsData.key[minVertex.id],
                explanation: `Adding edge ${primsData.vertices[primsData.parent[minVertex.id]].label}-${minVertex.label} (weight: ${primsData.key[minVertex.id]}) to MST.`
            });
        }
        
        // Update keys of adjacent vertices
        primsData.edges.forEach(edge => {
            let u, v, w;
            if (edge.from === minVertex.id && !primsData.inMST.includes(edge.to)) {
                u = minVertex.id;
                v = edge.to;
                w = edge.weight;
            } else if (edge.to === minVertex.id && !primsData.inMST.includes(edge.from)) {
                u = minVertex.id;
                v = edge.from;
                w = edge.weight;
            }
            
            if (u !== undefined && w < primsData.key[v]) {
                primsData.key[v] = w;
                primsData.parent[v] = u;
                primsData.steps.push({
                    type: 'update_key',
                    vertex: primsData.vertices[v],
                    key: w,
                    parent: primsData.vertices[u],
                    explanation: `Updating key of vertex ${primsData.vertices[v].label} to ${w} (parent: ${primsData.vertices[u].label}).`
                });
            }
        });
    }
    
    primsData.steps.push({
        type: 'complete',
        explanation: `MST complete! Total weight: ${primsData.mst.reduce((sum, e) => sum + e.weight, 0)}`
    });
    
    // Reset for step-by-step execution
    primsData.inMST = [];
    primsData.mst = [];
    primsData.vertices.forEach(v => {
        primsData.key[v.id] = Infinity;
        primsData.parent[v.id] = null;
    });
    
    document.getElementById('prims-total-steps').textContent = primsData.steps.length;
    primsData.currentStep = 0;
    updatePrimsControls();
}

function primsNextStep() {
    if (primsData.currentStep < primsData.steps.length) {
        executePrimsStep(primsData.currentStep);
        primsData.currentStep++;
        updatePrimsControls();
    }
}

function primsPrevStep() {
    if (primsData.currentStep > 0) {
        primsData.currentStep--;
        primsReset();
        for (let i = 0; i < primsData.currentStep; i++) {
            executePrimsStep(i);
        }
        updatePrimsControls();
    }
}

function executePrimsStep(stepIndex) {
    if (stepIndex >= primsData.steps.length) return;
    
    const step = primsData.steps[stepIndex];
    updatePrimsExplanation(step.explanation);
    
    if (step.type === 'start') {
        primsData.key[step.vertex.id] = 0;
    } else if (step.type === 'add_vertex') {
        primsData.inMST.push(step.vertex.id);
    } else if (step.type === 'add_edge') {
        primsData.mst.push({
            from: step.from,
            to: step.to,
            weight: step.weight
        });
    } else if (step.type === 'update_key') {
        primsData.key[step.vertex.id] = step.key;
        primsData.parent[step.vertex.id] = step.parent.id;
    }
    
    drawPrims();
    document.getElementById('prims-step-count').textContent = stepIndex + 1;
}

function primsAutoRun() {
    if (primsData.autoRunning) {
        primsData.autoRunning = false;
        if (primsData.autoInterval) {
            clearInterval(primsData.autoInterval);
            primsData.autoInterval = null;
        }
        document.getElementById('prims-auto').textContent = 'Auto Run All';
        document.getElementById('prims-auto').classList.remove('running');
    } else {
        if (primsData.currentStep >= primsData.steps.length) {
            primsReset();
        }
        primsData.autoRunning = true;
        document.getElementById('prims-auto').textContent = 'Stop';
        document.getElementById('prims-auto').classList.add('running');
        
        primsData.autoInterval = setInterval(() => {
            if (primsData.currentStep < primsData.steps.length) {
                primsNextStep();
            } else {
                primsAutoRun();
            }
        }, 1500);
    }
}

function updatePrimsControls() {
    const prevBtn = document.getElementById('prims-prev');
    const nextBtn = document.getElementById('prims-next');
    const autoBtn = document.getElementById('prims-auto');
    
    prevBtn.disabled = primsData.currentStep === 0;
    nextBtn.disabled = primsData.currentStep >= primsData.steps.length;
    
    if (primsData.currentStep >= primsData.steps.length) {
        autoBtn.disabled = true;
        autoBtn.classList.remove('running');
        autoBtn.textContent = 'Auto Run All';
    } else {
        autoBtn.disabled = false;
    }
}

function updatePrimsExplanation(text) {
    document.getElementById('prims-explanation').textContent = text;
}

function drawPrims() {
    const canvas = document.getElementById('primsCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (primsData.vertices.length === 0) {
        ctx.fillStyle = '#7f8c8d';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Click "Generate Random" to start', canvas.width / 2, canvas.height / 2);
        return;
    }
    
    // Draw edges
    ctx.strokeStyle = '#bdc3c7';
    ctx.lineWidth = 1;
    primsData.edges.forEach(edge => {
        const from = primsData.vertices[edge.from];
        const to = primsData.vertices[edge.to];
        const inMST = primsData.mst.some(e => 
            (e.from === edge.from && e.to === edge.to) || 
            (e.from === edge.to && e.to === edge.from)
        );
        
        if (inMST) {
            ctx.strokeStyle = '#27ae60';
            ctx.lineWidth = 4;
        } else {
            ctx.strokeStyle = '#bdc3c7';
            ctx.lineWidth = 1;
        }
        
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.stroke();
        
        // Draw weight
        const midX = (from.x + to.x) / 2;
        const midY = (from.y + to.y) / 2;
        ctx.fillStyle = inMST ? '#27ae60' : '#7f8c8d';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(edge.weight.toString(), midX, midY - 5);
    });
    
    // Draw vertices
    primsData.vertices.forEach(vertex => {
        const inMST = primsData.inMST.includes(vertex.id);
        const color = inMST ? '#27ae60' : '#3498db';
        const strokeColor = inMST ? '#229954' : '#2980b9';
        
        ctx.beginPath();
        ctx.arc(vertex.x, vertex.y, 25, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Draw label
        ctx.fillStyle = 'white';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(vertex.label, vertex.x, vertex.y);
        
        // Draw key value
        if (primsData.key[vertex.id] !== undefined && primsData.key[vertex.id] !== Infinity) {
            ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-color').trim();
            ctx.font = '12px Arial';
            ctx.fillText(`key: ${primsData.key[vertex.id]}`, vertex.x, vertex.y + 40);
        }
    });
}

// Placeholder implementations for remaining algorithms (to be completed)
function kruskalRandom() { 
    updateKruskalExplanation('Kruskal\'s algorithm - Generate Random data (To be implemented)');
}
function kruskalReset() { updateKruskalExplanation('Reset'); }
function kruskalNextStep() { updateKruskalExplanation('Next Step'); }
function kruskalPrevStep() { updateKruskalExplanation('Previous Step'); }
function kruskalAutoRun() { updateKruskalExplanation('Auto Run'); }
function updateKruskalExplanation(text) {
    const el = document.getElementById('kruskal-explanation');
    if (el) el.textContent = text;
}

function dijkstraRandom() { 
    updateDijkstraExplanation('Dijkstra\'s algorithm - Generate Random data (To be implemented)');
}
function dijkstraReset() { updateDijkstraExplanation('Reset'); }
function dijkstraNextStep() { updateDijkstraExplanation('Next Step'); }
function dijkstraPrevStep() { updateDijkstraExplanation('Previous Step'); }
function dijkstraAutoRun() { updateDijkstraExplanation('Auto Run'); }
function updateDijkstraExplanation(text) {
    const el = document.getElementById('dijkstra-explanation');
    if (el) el.textContent = text;
}

function bfsRandom() { 
    updateBFSExplanation('BFS algorithm - Generate Random data (To be implemented)');
}
function bfsReset() { updateBFSExplanation('Reset'); }
function bfsNextStep() { updateBFSExplanation('Next Step'); }
function bfsPrevStep() { updateBFSExplanation('Previous Step'); }
function bfsAutoRun() { updateBFSExplanation('Auto Run'); }
function updateBFSExplanation(text) {
    const el = document.getElementById('bfs-explanation');
    if (el) el.textContent = text;
}

function dfsRandom() { 
    updateDFSExplanation('DFS algorithm - Generate Random data (To be implemented)');
}
function dfsReset() { updateDFSExplanation('Reset'); }
function dfsNextStep() { updateDFSExplanation('Next Step'); }
function dfsPrevStep() { updateDFSExplanation('Previous Step'); }
function dfsAutoRun() { updateDFSExplanation('Auto Run'); }
function updateDFSExplanation(text) {
    const el = document.getElementById('dfs-explanation');
    if (el) el.textContent = text;
}
