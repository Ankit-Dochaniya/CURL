let pageFlip;
let totalPages = 0;
let currentPage = 1;
let pageTimes = [];
let minsPerPage = 2;
let pageImages = [];

// Initialize pdf.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

const uploadZone = document.getElementById('upload-zone');
const fileInput = document.getElementById('file-input');

uploadZone.addEventListener('click', () => fileInput.click());
uploadZone.addEventListener('dragover', (e) => { e.preventDefault(); uploadZone.style.borderColor = '#fff'; });
uploadZone.addEventListener('dragleave', () => uploadZone.style.borderColor = '#4A90D9');
uploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadZone.style.borderColor = '#4A90D9';
    if (e.dataTransfer.files.length) {
        handleFile(e.dataTransfer.files[0]);
    }
});
fileInput.addEventListener('change', (e) => {
    if (e.target.files.length) {
        handleFile(e.target.files[0]);
    }
});

function handleFile(file) {
    if (file.type !== 'application/pdf') {
        alert('Please upload a PDF file.');
        return;
    }
    
    uploadZone.innerHTML = 'Loading PDF... Please wait.';
    
    const reader = new FileReader();
    reader.onload = async function() {
        const typedarray = new Uint8Array(this.result);
        
        try {
            const pdf = await pdfjsLib.getDocument({ data: typedarray }).promise;
            totalPages = pdf.numPages;
            pageImages = [];
            
            for (let i = 1; i <= totalPages; i++) {
                uploadZone.innerHTML = `Rendering page ${i} of ${totalPages}...`;
                const imgDataUrl = await renderPage(pdf, i);
                pageImages.push(imgDataUrl);
            }
            
            uploadZone.style.display = 'none';
            document.getElementById('book-container').style.display = 'block';
            document.getElementById('nav-controls').style.display = 'flex';
            
            initPageFlip();
            updateProgressRing();
            updateStatsBar();
            document.getElementById('page-counter').textContent = `Page ${currentPage} of ${totalPages}`;
            
        } catch (err) {
            console.error(err);
            uploadZone.innerHTML = 'Error loading PDF. Please try again.';
        }
    };
    reader.readAsArrayBuffer(file);
}

async function renderPage(pdf, pageNum) {
    const page = await pdf.getPage(pageNum);
    const scale = 1.5;  // Higher = better quality
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');
    await page.render({ canvasContext: ctx, viewport }).promise;
    return canvas.toDataURL('image/png');
}

function initPageFlip() {
    pageFlip = new St.PageFlip(document.getElementById('book'), {
        width: 450,          // Width of ONE page (book shows two pages)
        height: 600,         // Height of a page
        showCover: true,     // First page is a standalone cover
        mobileScrollSupport: false,
        useMouseEvents: true,
        usePortrait: false,        // Force 2-page spread so back page is always visible
        maxShadowOpacity: 0.15     // Reduce glossy reflection to look like real paper
    });
    
    pageFlip.loadFromImages(pageImages);
    
    pageFlip.on('flip', (e) => {
        currentPage = e.data + 1;  // StPageFlip uses 0-based index
        pageTimes.push(Date.now());
        updatePace();
        updateProgressRing();
        updateStatsBar();
        document.getElementById('page-counter').textContent = `Page ${currentPage} of ${totalPages}`;
    });
}

function updateProgressRing() {
    if (totalPages === 0) return;
    const pct = Math.round((currentPage / totalPages) * 100);
    const circumference = 2 * Math.PI * 22;  // r=22
    const offset = circumference * (1 - pct / 100);
    document.querySelector('#progress-ring circle:last-child').setAttribute('stroke-dashoffset', offset);
    document.getElementById('pct-text').textContent = pct + '% complete';
}

function updatePace() {
    if (pageTimes.length < 2) return;
    const recent = pageTimes.slice(-5);  // Use last 5 turns for rolling average
    let sum = 0;
    for (let i = 1; i < recent.length; i++) sum += recent[i] - recent[i-1];
    const avgMs = sum / (recent.length - 1);
    minsPerPage = Math.max(1, Math.round(avgMs / 60000));
}

function updateStatsBar() {
    const left = totalPages - currentPage;
    const timeLeft = left * minsPerPage;
    document.getElementById('pace-text').textContent = minsPerPage + ' min/page';
    document.getElementById('time-left').textContent = timeLeft + ' min left';
}

document.getElementById('btn-prev').onclick = () => pageFlip.flipPrev();
document.getElementById('btn-next').onclick = () => pageFlip.flipNext();
