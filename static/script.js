// Global state management
let releaseEntries = [];
let selectedItem = null;
let activeFilter = 'all';
let searchQuery = '';

// Icons dictionary for category badges
const categoryIcons = {
    feature: `<svg class="type-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`,
    announcement: `<svg class="type-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>`,
    issue: `<svg class="type-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`,
    deprecation: `<svg class="type-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="9" x2="15" y2="15"></line><line x1="15" y1="9" x2="9" y2="15"></line></svg>`,
    update: `<svg class="type-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`
};

// DOM Elements
const refreshBtn = document.getElementById('refresh-btn');
const spinnerIcon = document.getElementById('spinner-icon');
const lastUpdatedSpan = document.getElementById('last-updated');
const searchInput = document.getElementById('search-input');
const themeToggleBtn = document.getElementById('theme-toggle');
const themeMoonIcon = document.getElementById('theme-moon');
const themeSunIcon = document.getElementById('theme-sun');
const exportCsvBtn = document.getElementById('export-csv-btn');
const tabButtons = document.querySelectorAll('.tab-btn');
const feedList = document.getElementById('feed-list');
const loader = document.getElementById('loader');
const errorState = document.getElementById('error-state');
const errorMessage = document.getElementById('error-message');
const emptyState = document.getElementById('empty-state');
const retryBtn = document.getElementById('retry-btn');

// Detail Panel Elements
const detailPlaceholder = document.getElementById('detail-placeholder');
const detailContent = document.getElementById('detail-content');
const detailDate = document.getElementById('detail-date');
const detailTypeBadge = document.getElementById('detail-type-badge');
const detailSourceLink = document.getElementById('detail-source-link');
const detailBody = document.getElementById('detail-body');

// Tweet Composer Elements
const tweetTextarea = document.getElementById('tweet-textarea');
const charCounter = document.getElementById('char-counter');
const progressRingIndicator = document.getElementById('progress-ring-indicator');
const tweetBtn = document.getElementById('tweet-btn');
const resetTweetBtn = document.getElementById('reset-tweet-btn');
const composerFooterContainer = document.querySelector('.composer-footer');

// Progress Ring Configuration
const ringRadius = 9;
const ringCircumference = 2 * Math.PI * ringRadius;

// Initialize progress ring SVG attributes
if (progressRingIndicator) {
    progressRingIndicator.style.strokeDasharray = `${ringCircumference} ${ringCircumference}`;
    progressRingIndicator.style.strokeDashoffset = ringCircumference;
}

// Fetch release notes from backend
async function fetchReleaseNotes() {
    setLoadingState(true);
    try {
        const response = await fetch('/api/release-notes');
        const data = await response.json();
        
        if (data.success) {
            releaseEntries = data.entries;
            
            // Format updated date beautifully
            if (data.feed_updated) {
                const date = new Date(data.feed_updated);
                lastUpdatedSpan.textContent = `Updated: ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
            } else {
                lastUpdatedSpan.textContent = 'Updated: Just now';
            }
            
            renderFeed();
            showError(false);
        } else {
            showError(true, data.error || 'Server error occurred while fetching release notes.');
        }
    } catch (err) {
        showError(true, 'Failed to connect to the server. Please ensure the backend is running.');
        console.error(err);
    } finally {
        setLoadingState(false);
    }
}

// Set UI loading state
function setLoadingState(isLoading) {
    if (isLoading) {
        spinnerIcon.classList.add('spinning');
        refreshBtn.disabled = true;
        loader.classList.remove('hidden');
        feedList.classList.add('hidden');
        errorState.classList.add('hidden');
        emptyState.classList.add('hidden');
    } else {
        spinnerIcon.classList.remove('spinning');
        refreshBtn.disabled = false;
        loader.classList.add('hidden');
        feedList.classList.remove('hidden');
    }
}

// Show/hide error message
function showError(show, message = '') {
    if (show) {
        errorMessage.textContent = message;
        errorState.classList.remove('hidden');
        feedList.classList.add('hidden');
        emptyState.classList.add('hidden');
    } else {
        errorState.classList.add('hidden');
    }
}

// Render feed entries to the left panel
function renderFeed() {
    feedList.innerHTML = '';
    let matchesCount = 0;
    
    releaseEntries.forEach((entry, entryIndex) => {
        // Filter items within the entry
        const filteredItems = entry.items.filter(item => {
            const matchesTab = activeFilter === 'all' || item.type.toLowerCase() === activeFilter.toLowerCase();
            
            const rawText = (item.type + ' ' + stripHtml(item.content_html)).toLowerCase();
            const matchesSearch = rawText.includes(searchQuery.toLowerCase());
            
            return matchesTab && matchesSearch;
        });

        if (filteredItems.length > 0) {
            matchesCount += filteredItems.length;
            
            // Create a Date group
            const dateGroup = document.createElement('div');
            dateGroup.className = 'date-group';
            
            const dateHeader = document.createElement('div');
            dateHeader.className = 'date-group-header';
            dateHeader.textContent = entry.title; // Typically the human-readable date
            dateGroup.appendChild(dateHeader);
            
            // Create update items
            filteredItems.forEach((item, itemIndex) => {
                const itemEl = document.createElement('div');
                itemEl.className = 'update-item';
                
                // Set active class if selected
                if (selectedItem && 
                    selectedItem.entryIndex === entryIndex && 
                    selectedItem.itemIndex === itemIndex &&
                    selectedItem.type === item.type) {
                    itemEl.classList.add('selected');
                }
                
                const meta = document.createElement('div');
                meta.className = 'item-meta';
                
                const badge = document.createElement('span');
                badge.className = `badge badge-${item.type.toLowerCase()}`;
                const iconSvg = categoryIcons[item.type.toLowerCase()] || categoryIcons.update;
                badge.innerHTML = `${iconSvg}<span>${item.type}</span>`;
                meta.appendChild(badge);
                
                // Clipboard copy button
                const copyBtn = document.createElement('button');
                copyBtn.className = 'btn-copy-card';
                copyBtn.title = 'Copy update text to clipboard';
                copyBtn.innerHTML = `
                    <svg class="icon-copy" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                `;
                
                copyBtn.addEventListener('click', (e) => {
                    e.stopPropagation(); // prevent card select trigger
                    const cleanDesc = stripHtml(item.content_html);
                    const textToCopy = `BigQuery Update (${entry.title}) - ${item.type}:\n${cleanDesc}\n\nRead more: ${entry.link}`;
                    
                    navigator.clipboard.writeText(textToCopy).then(() => {
                        const originalHtml = copyBtn.innerHTML;
                        copyBtn.innerHTML = `
                            <svg class="icon-check" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                        `;
                        copyBtn.classList.add('copied');
                        setTimeout(() => {
                            copyBtn.innerHTML = originalHtml;
                            copyBtn.classList.remove('copied');
                        }, 1500);
                    }).catch(err => {
                        console.error('Failed to copy to clipboard', err);
                    });
                });
                meta.appendChild(copyBtn);
                
                itemEl.appendChild(meta);
                
                const preview = document.createElement('div');
                preview.className = 'item-preview';
                preview.textContent = stripHtml(item.content_html);
                itemEl.appendChild(preview);
                
                // Add click listener
                itemEl.addEventListener('click', () => {
                    selectItem(entry, item, entryIndex, itemIndex);
                    // Update classes
                    document.querySelectorAll('.update-item').forEach(el => el.classList.remove('selected'));
                    itemEl.classList.add('selected');
                });
                
                dateGroup.appendChild(itemEl);
            });
            
            feedList.appendChild(dateGroup);
        }
    });
    
    // Handle empty state
    if (matchesCount === 0 && releaseEntries.length > 0) {
        emptyState.classList.remove('hidden');
    } else {
        emptyState.classList.add('hidden');
    }
}

// Select specific release note item
function selectItem(entry, item, entryIndex, itemIndex) {
    selectedItem = {
        ...item,
        entryIndex,
        itemIndex,
        date: entry.title,
        link: entry.link
    };
    
    // Populate Detail panel
    detailPlaceholder.classList.add('hidden');
    detailContent.classList.remove('hidden');
    
    detailDate.textContent = entry.title;
    detailTypeBadge.className = `badge badge-${item.type.toLowerCase()}`;
    const iconSvg = categoryIcons[item.type.toLowerCase()] || categoryIcons.update;
    detailTypeBadge.innerHTML = `${iconSvg}<span>${item.type}</span>`;
    detailSourceLink.href = entry.link;
    detailBody.innerHTML = item.content_html;
    
    // Auto populate tweet composer
    generateDefaultTweet();
    
    // Scroll detail panel to top
    document.querySelector('.detail-panel').scrollTop = 0;
}

// Clean HTML to extract plain text
function stripHtml(htmlStr) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlStr;
    
    // Extract text content and tidy spacing
    let text = tempDiv.textContent || tempDiv.innerText || '';
    return text.replace(/\s+/g, ' ').trim();
}

// Generate default tweet template based on selected item
function generateDefaultTweet() {
    if (!selectedItem) return;
    
    const maxCleanTextLen = 170; // Reserve characters for header & URL
    let rawText = stripHtml(selectedItem.content_html);
    
    // Clean up typical prefix headings if they were duplicated
    if (rawText.startsWith(selectedItem.type)) {
        rawText = rawText.substring(selectedItem.type.length).trim();
    }
    
    // Truncate if description is very long
    let description = rawText;
    if (description.length > maxCleanTextLen) {
        description = description.substring(0, maxCleanTextLen - 3) + '...';
    }
    
    // Prefill text formatting
    const tweetText = `BigQuery Update (${selectedItem.date}) - ${selectedItem.type}:\n${description}\n\nRead more: ${selectedItem.link}`;
    
    tweetTextarea.value = tweetText;
    updateCharCount();
}

// Update character counter and progress ring
function updateCharCount() {
    const text = tweetTextarea.value;
    const remaining = 280 - text.length;
    
    charCounter.textContent = remaining;
    
    // Adjust colors and UI styling based on character length
    if (remaining < 0) {
        composerFooterContainer.className = 'composer-footer char-danger';
        tweetBtn.disabled = true;
    } else if (remaining <= 20) {
        composerFooterContainer.className = 'composer-footer char-warning';
        tweetBtn.disabled = false;
    } else {
        composerFooterContainer.className = 'composer-footer';
        tweetBtn.disabled = false;
    }
    
    // Update SVG progress ring
    const percentage = Math.min(Math.max(text.length / 280, 0), 1);
    const offset = ringCircumference - (percentage * ringCircumference);
    progressRingIndicator.style.strokeDashoffset = offset;
}

// Execute tweet posting via Twitter Web Intent
function postTweet() {
    const text = tweetTextarea.value;
    if (text.length > 280) return;
    
    const twitterIntentUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(twitterIntentUrl, '_blank');
}

// Export current filtered dataset to CSV file
function exportToCSV() {
    const csvRows = [
        ["Date", "Type", "Description", "Source Link"]
    ];
    
    releaseEntries.forEach(entry => {
        entry.items.forEach(item => {
            const matchesTab = activeFilter === 'all' || item.type.toLowerCase() === activeFilter.toLowerCase();
            const rawText = (item.type + ' ' + stripHtml(item.content_html)).toLowerCase();
            const matchesSearch = rawText.includes(searchQuery.toLowerCase());
            
            if (matchesTab && matchesSearch) {
                const cleanDesc = stripHtml(item.content_html);
                csvRows.push([entry.title, item.type, cleanDesc, entry.link]);
            }
        });
    });
    
    if (csvRows.length <= 1) {
        alert("No items to export for the current filters.");
        return;
    }
    
    // Format rows correctly: double quotes escaped, fields comma-separated
    const csvContent = csvRows.map(row => 
        row.map(val => `"${val.replace(/"/g, '""')}"`).join(",")
    ).join("\n");
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `bigquery_release_notes_${activeFilter}_filter.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Toggle page color scheme (Light/Dark mode)
function toggleTheme() {
    document.body.classList.toggle('light-theme');
    const isLight = document.body.classList.contains('light-theme');
    
    if (isLight) {
        themeMoonIcon.classList.add('hidden');
        themeSunIcon.classList.remove('hidden');
        localStorage.setItem('theme', 'light');
    } else {
        themeMoonIcon.classList.remove('hidden');
        themeSunIcon.classList.add('hidden');
        localStorage.setItem('theme', 'dark');
    }
}

// Event Listeners
refreshBtn.addEventListener('click', fetchReleaseNotes);
retryBtn.addEventListener('click', fetchReleaseNotes);
exportCsvBtn.addEventListener('click', exportToCSV);
themeToggleBtn.addEventListener('click', toggleTheme);

searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    renderFeed();
});

tabButtons.forEach(button => {
    button.addEventListener('click', () => {
        tabButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        activeFilter = button.getAttribute('data-filter');
        renderFeed();
    });
});

tweetTextarea.addEventListener('input', updateCharCount);
resetTweetBtn.addEventListener('click', generateDefaultTweet);
tweetBtn.addEventListener('click', postTweet);

// Initial Load
document.addEventListener('DOMContentLoaded', () => {
    // Check saved theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        document.body.classList.add('light-theme');
        themeMoonIcon.classList.add('hidden');
        themeSunIcon.classList.remove('hidden');
    }
    fetchReleaseNotes();
});
