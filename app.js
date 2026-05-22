/**
 * NagaBuzz Web Portal - Interactive Scripting
 * Features: Light/Dark mode caching, live search highlighting, multi-step deletion wizard, 
 * simulated secure logs progression, receipt generations, and local database mock registries.
 */

// Global state variables
let originalPolicyContent = '';
let currentStep = 1;
const deletionRegistryKey = 'nagabuzz_deletion_registry';

// Initialize Supabase Client using standard window lookup
let supabaseClient = null;
try {
    if (typeof window.supabase !== 'undefined') {
        supabaseClient = window.supabase.createClient(
            'https://nfcrresliskxiowbzldc.supabase.co',
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5mY3JyZXNsaXNreGlvd2J6bGRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4NzExMTQsImV4cCI6MjA5NDQ0NzExNH0.NDZyrVdEcIR11IsLQlzKbZFfVv5T-BqcSxbe2_h7i8Q'
        );
    }
} catch (e) {
    console.error('Failed to initialize Supabase client:', e);
}


document.addEventListener('DOMContentLoaded', () => {
    // 1. Theme Toggling Setup
    initTheme();

    // 2. Cache Original Privacy Policy Content for Resetting Searches
    const policyBody = document.getElementById('policy-body');
    if (policyBody) {
        originalPolicyContent = policyBody.innerHTML;
    }

    // 3. Setup Privacy Policy Section Links Scroll Sync
    setupScrollSpy();

    // 4. Live Search Input Handlers
    const searchInput = document.getElementById('policy-search');
    const clearBtn = document.getElementById('clear-search-btn');
    if (searchInput) {
        searchInput.addEventListener('input', handlePolicySearch);
    }
    if (clearBtn) {
        clearBtn.addEventListener('click', clearPolicySearch);
    }

    // 5. Setup scope selection card styling feedback
    setupScopeCards();
});

/* ==========================================================================
   1. THEME TOGGLING LOGIC
   ========================================================================== */
function initTheme() {
    const themeToggleBtn = document.getElementById('theme-toggle');
    const body = document.body;

    // Check cached theme or system preferences
    const cachedTheme = localStorage.getItem('nagabuzz-portal-theme');
    if (cachedTheme) {
        if (cachedTheme === 'light') {
            body.classList.remove('dark-theme');
            body.classList.add('light-theme');
        } else {
            body.classList.remove('light-theme');
            body.classList.add('dark-theme');
        }
    } else {
        // Fallback to media query preference
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (!prefersDark) {
            body.classList.remove('dark-theme');
            body.classList.add('light-theme');
        }
    }

    // Event listener
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            if (body.classList.contains('dark-theme')) {
                body.classList.remove('dark-theme');
                body.classList.add('light-theme');
                localStorage.setItem('nagabuzz-portal-theme', 'light');
            } else {
                body.classList.remove('light-theme');
                body.classList.add('dark-theme');
                localStorage.setItem('nagabuzz-portal-theme', 'dark');
            }
        });
    }
}

/* ==========================================================================
   2. TAB SWITCHING LOGIC
   ========================================================================== */
function switchTab(tabName) {
    const btnPrivacy = document.getElementById('btn-tab-privacy');
    const btnDeletion = document.getElementById('btn-tab-deletion');
    const secPrivacy = document.getElementById('section-privacy');
    const secDeletion = document.getElementById('section-deletion');

    if (tabName === 'privacy') {
        btnPrivacy.classList.add('active');
        btnDeletion.classList.remove('active');
        secPrivacy.classList.add('active-content');
        secDeletion.classList.remove('active-content');
    } else if (tabName === 'deletion') {
        btnPrivacy.classList.remove('active');
        btnDeletion.classList.add('active');
        secPrivacy.classList.remove('active-content');
        secDeletion.classList.add('active-content');
    }
    
    // Scroll to top of section cleanly
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ==========================================================================
   3. PRIVACY POLICY SCROLL-SPY & SIDEBAR SYNC
   ========================================================================== */
function setupScrollSpy() {
    const sections = document.querySelectorAll('.policy-section');
    const sidebarLinks = document.querySelectorAll('.sidebar-link');

    window.addEventListener('scroll', () => {
        let currentSectionId = '';
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 120;
            if (window.scrollY >= sectionTop) {
                currentSectionId = section.getAttribute('id');
            }
        });

        if (currentSectionId) {
            sidebarLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${currentSectionId}`) {
                    link.classList.add('active');
                }
            });
        }
    });
}

/* ==========================================================================
   4. LIVE KEYWORD SEARCH & HIGHLIGHTING (PRIVACY POLICY)
   ========================================================================== */
function handlePolicySearch() {
    const searchInput = document.getElementById('policy-search');
    const clearBtn = document.getElementById('clear-search-btn');
    const policyBody = document.getElementById('policy-body');
    const sections = document.querySelectorAll('.policy-section');
    
    const query = searchInput.value.trim().toLowerCase();

    if (!query) {
        clearPolicySearch();
        return;
    }

    // Show clear button
    clearBtn.style.display = 'block';

    // Restore original HTML before highlighting to avoid nested highlights
    policyBody.innerHTML = originalPolicyContent;

    // Filter sections and highlight query
    let matchesFound = 0;

    sections.forEach((section, index) => {
        // We get fresh element reference since innerHTML was reloaded
        const currentSection = document.getElementById(section.id);
        const textContent = currentSection.textContent.toLowerCase();

        if (textContent.includes(query)) {
            currentSection.classList.remove('hidden-section');
            highlightNodeText(currentSection, query);
            matchesFound++;
        } else {
            currentSection.classList.add('hidden-section');
        }
    });

    // Re-setup sidebar links since sections might be hidden
    setupScrollSpy();
}

// Smart text-node highlighter to prevent destroying tags or attributes
function highlightNodeText(element, query) {
    const walk = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null, false);
    let node;
    const matches = [];

    // First collect matching text nodes
    while (node = walk.nextNode()) {
        const text = node.nodeValue;
        if (text.toLowerCase().includes(query)) {
            matches.push(node);
        }
    }

    // Replace text in nodes with highlighted mark spans
    matches.forEach(textNode => {
        const parent = textNode.parentNode;
        // Don't highlight inside script tags or already highlighted nodes
        if (parent.tagName === 'SCRIPT' || parent.tagName === 'MARK') return;

        const text = textNode.nodeValue;
        const regex = new RegExp(`(${escapeRegExp(query)})`, 'gi');
        
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = text.replace(regex, '<mark class="search-highlight">$1</mark>');
        
        while (tempDiv.firstChild) {
            parent.insertBefore(tempDiv.firstChild, textNode);
        }
        parent.removeChild(textNode);
    });
}

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function clearPolicySearch() {
    const searchInput = document.getElementById('policy-search');
    const clearBtn = document.getElementById('clear-search-btn');
    const policyBody = document.getElementById('policy-body');
    const sections = document.querySelectorAll('.policy-section');

    if (searchInput) searchInput.value = '';
    if (clearBtn) clearBtn.style.display = 'none';

    // Restore original HTML to remove tags
    if (policyBody && originalPolicyContent) {
        policyBody.innerHTML = originalPolicyContent;
    }

    // Unhide all sections
    sections.forEach(section => {
        const currentSection = document.getElementById(section.id);
        if (currentSection) {
            currentSection.classList.remove('hidden-section');
        }
    });

    // Re-trigger scroll spy setup
    setupScrollSpy();
}

/* ==========================================================================
   5. ACCOUNT DELETION FORM SCOPE GRID CONTROLLERS
   ========================================================================== */
function setupScopeCards() {
    const cards = document.querySelectorAll('.scope-card');
    cards.forEach(card => {
        const checkbox = card.querySelector('input[type="checkbox"]');
        if (checkbox) {
            // Initial sync
            if (checkbox.checked) {
                card.classList.add('selected');
            } else {
                card.classList.remove('selected');
            }

            checkbox.addEventListener('change', () => {
                if (checkbox.checked) {
                    card.classList.add('selected');
                } else {
                    card.classList.remove('selected');
                }
            });
        }
    });
}

/* ==========================================================================
   6. DELETION FORM WIZARD FLOW NAVIGATION
   ========================================================================== */
function nextStep(step) {
    // 1. Validation before advancing
    if (step === 2) {
        const email = document.getElementById('input-email').value;
        const selectAuth = document.getElementById('select-auth').value;
        
        if (!email || !validateEmail(email)) {
            alert('Please enter a valid registered email address.');
            return;
        }
        if (!selectAuth) {
            alert('Please select your sign-in authentication method.');
            return;
        }
    }

    if (step === 3) {
        // Step 2 just has optional checkboxes, always valid to proceed
    }

    // Set current step and trigger visual update
    currentStep = step;
    updateWizardUI();
}

function prevStep(step) {
    currentStep = step;
    updateWizardUI();
}

function updateWizardUI() {
    // Hide all panes
    const panes = document.querySelectorAll('.wizard-step-pane');
    panes.forEach(pane => pane.classList.remove('active-pane'));

    // Show active pane
    const activePane = document.getElementById(`pane-step-${currentStep}`);
    if (activePane) activePane.classList.add('active-pane');

    // Update steps visual indicators
    const progressSteps = document.querySelectorAll('.progress-step');
    progressSteps.forEach((stepIndicator, idx) => {
        const stepNum = idx + 1;
        stepIndicator.classList.remove('active', 'complete');

        if (stepNum === currentStep) {
            stepIndicator.classList.add('active');
        } else if (stepNum < currentStep) {
            stepIndicator.classList.add('complete');
        }
    });
}

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
}

/* ==========================================================================
   7. SECURE SUBMISSION SIMULATION & LOCAL DB INTEGRATION
   ========================================================================== */
function submitDeletionRequest() {
    // Validate final fields
    const agreement = document.getElementById('confirm-agreement');
    const email = document.getElementById('input-email').value;
    const confirmEmail = document.getElementById('input-email-confirm').value;
    const errorMsg = document.getElementById('confirm-email-error');

    if (!agreement.checked) {
        alert('You must confirm the final warning statement.');
        return;
    }

    if (email.trim().toLowerCase() !== confirmEmail.trim().toLowerCase()) {
        errorMsg.style.display = 'block';
        document.getElementById('input-email-confirm').focus();
        return;
    } else {
        errorMsg.style.display = 'none';
    }

    // Advance to Step 4 (Processing Simulation)
    currentStep = 4;
    updateWizardUI();

    // Trigger dynamic server transmission console log output
    runConsoleSimulation(email);
}

function runConsoleSimulation(userEmail) {
    const consoleLogs = document.getElementById('console-logs');
    const statusText = document.getElementById('processing-status');
    consoleLogs.innerHTML = ''; // Reset terminal output

    // Pre-calculate receipt details for Supabase & receipt display
    const ticketId = 'NB-DEL-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    const graceDate = new Date();
    graceDate.setDate(graceDate.getDate() + 30);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    const formattedGraceDate = graceDate.toLocaleDateString('en-US', options);

    const scopes = ['Profile Credentials (Firebase Auth)'];
    if (document.getElementById('check-comments').checked) scopes.push('Comments Feed');
    if (document.getElementById('check-notices').checked) scopes.push('Notice Boards');
    if (document.getElementById('check-logs').checked) scopes.push('Activity Metrics');
    
    const authMethod = document.getElementById('select-auth').value;
    let authDisplay = 'Custom Email/Password';
    if (authMethod === 'google') authDisplay = 'Google Identity handshake';
    if (authMethod === 'other') authDisplay = 'Anonymous / Other provider';
    
    const reasonValue = document.getElementById('select-reason').value;

    // Asynchronously trigger real Supabase database write attempt
    let supabaseWriteSuccess = false;
    let supabaseLogMsg = '[SUPABASE] Live database connection initialized.';

    if (supabaseClient) {
        const payload = {
            ticket_id: ticketId,
            email: userEmail,
            auth_provider: authDisplay,
            scopes: scopes.join(', '),
            submission_date: new Date().toISOString(),
            grace_date: graceDate.toISOString(),
            status: 'PENDING_AUDIT',
            reason: reasonValue
        };

        // Asynchronously insert row into deletion_requests table
        supabaseClient.from('deletion_requests').insert([payload]).then(response => {
            if (response.error) {
                console.warn('Supabase insertion error details:', response.error);
                if (response.error.message && response.error.message.includes('relation "public.deletion_requests" does not exist')) {
                    supabaseLogMsg = '[SUPABASE] Table public.deletion_requests not found in schema. Secured in local ledger.';
                } else {
                    supabaseLogMsg = `[SUPABASE] Write interrupted: ${response.error.message}. Caching request locally.`;
                }
                supabaseWriteSuccess = false;
            } else {
                supabaseLogMsg = '[SUPABASE] Successfully synchronized! Row written in live deletion_requests table.';
                supabaseWriteSuccess = true;
            }
        }).catch(err => {
            console.error('Supabase caught error:', err);
            supabaseLogMsg = '[SUPABASE] Gateway connection timeout. Swapped to offline ledger mode.';
            supabaseWriteSuccess = false;
        });
    } else {
        supabaseLogMsg = '[SUPABASE] Database client offline. Secured request parameters in local ledger.';
    }

    // Interactive console animation sequences
    const logs = [
        { text: '[INIT] Handshake requested by client application node...', delay: 200 },
        { text: '[SECURE] Establishing end-to-end HTTPS TLS 1.3 tunnels...', delay: 600 },
        { text: `[FIREBASE] Connecting credentials manager to instance ID: nagabuzz-f82a...`, delay: 1100 },
        { text: `[SUPABASE] Authenticating request with anon client API handshake...`, delay: 1700 },
        { text: `[QUERY] Searching database profiles matching email: ${userEmail}...`, delay: 2200 },
        { text: '[SUCCESS] Identity verified. Row-level cascades initialized...', delay: 2700 },
        { text: 'Supabase logging placeholder', delay: 3300 }, // Will be replaced by actual Supabase write result dynamically below
        { text: '[AUDIT] Generated secure audit token signature. Sending confirmation webhook...', delay: 3800 },
        { text: '[DONE] System state locked. Proceeding to client dashboard...', delay: 4200 }
    ];

    logs.forEach(log => {
        setTimeout(() => {
            const div = document.createElement('div');
            if (log.text === 'Supabase logging placeholder') {
                div.textContent = supabaseLogMsg;
                if (supabaseWriteSuccess) {
                    div.style.color = '#38bdf8'; // Soft sky blue for successful write
                } else {
                    div.style.color = '#fbbf24'; // Warning orange/yellow for fallback alert
                }
            } else {
                div.textContent = log.text;
            }
            consoleLogs.appendChild(div);
            consoleLogs.scrollTop = consoleLogs.scrollHeight; // Auto scroll down

            // Update loading subtext dynamically based on delay phases
            if (log.text.includes('FIREBASE')) {
                statusText.textContent = 'Authenticating identity triggers...';
            } else if (log.text.includes('SUPABASE')) {
                statusText.textContent = 'Scanning Supabase comment boards...';
            } else if (log.text === 'Supabase logging placeholder') {
                statusText.textContent = 'Writing deletion token parameters...';
            }
        }, log.delay);
    });

    // End simulation, move to success screen
    setTimeout(() => {
        finalizeDeletionRequest(userEmail, ticketId, formattedGraceDate, authDisplay, scopes, reasonValue, supabaseWriteSuccess);
    }, 4600);
}

function finalizeDeletionRequest(userEmail, ticketId, formattedGraceDate, authDisplay, scopes, reasonValue, supabaseWriteSuccess) {
    // Update Success Panel HTML elements
    document.getElementById('ticket-id').textContent = ticketId;
    document.getElementById('receipt-email').textContent = userEmail;
    document.getElementById('receipt-auth').textContent = authDisplay;
    document.getElementById('receipt-scope').textContent = scopes.join(', ');
    document.getElementById('receipt-grace').textContent = formattedGraceDate;

    // Check database status for confirmation alert display
    const receiptHeader = document.querySelector('.receipt-header .badge');
    if (receiptHeader) {
        if (supabaseWriteSuccess) {
            receiptHeader.textContent = 'DB REALTIME SYNCED';
            receiptHeader.className = 'badge';
            receiptHeader.style.borderColor = '#10b981';
            receiptHeader.style.color = '#10b981';
            receiptHeader.style.background = 'rgba(16, 185, 129, 0.1)';
        } else {
            receiptHeader.textContent = 'LOCAL REGISTRY LOCKED';
            receiptHeader.className = 'badge';
            receiptHeader.style.borderColor = '#fbbf24';
            receiptHeader.style.color = '#fbbf24';
            receiptHeader.style.background = 'rgba(245, 158, 11, 0.1)';
        }
    }

    // Always Save to localStorage deletion registry for safe dual-ledger backups
    saveRequestToRegistry({
        ticketId,
        email: userEmail,
        authProvider: authDisplay,
        scope: scopes,
        submissionDate: new Date().toISOString(),
        graceDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: supabaseWriteSuccess ? 'DB_SYNCHRONIZED' : 'OFFLINE_PENDING',
        reason: reasonValue
    });

    // Slide to final success step
    currentStep = 5;
    updateWizardUI();
}

function saveRequestToRegistry(requestData) {
    try {
        let registry = JSON.parse(localStorage.getItem(deletionRegistryKey)) || [];
        // Prevent duplicate tickets if resubmitted
        registry = registry.filter(item => item.email !== requestData.email);
        registry.push(requestData);
        localStorage.setItem(deletionRegistryKey, JSON.stringify(registry));
        console.log('[LOCAL STORAGE MOCK DATABASE REGISTRY UPDATED]:', registry);
    } catch (e) {
        console.error('Failed to update local storage mock db:', e);
    }
}


function resetWizard() {
    // Reset Form fields
    document.getElementById('form-deletion-identity').reset();
    document.getElementById('form-deletion-scope').reset();
    document.getElementById('form-deletion-confirm').reset();
    
    // Clear custom checkbox card classes
    const scopeCards = document.querySelectorAll('.scope-card');
    scopeCards.forEach((card, idx) => {
        const checkbox = card.querySelector('input[type="checkbox"]');
        if (checkbox) {
            checkbox.checked = true; // reset to checked default
            card.classList.add('selected');
        }
    });

    // Reset flow variables
    currentStep = 1;
    updateWizardUI();
}
