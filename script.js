/**
 * Executes when the DOM is fully loaded.
 * Sets up all event listeners and initial state.
 */
document.addEventListener('DOMContentLoaded', () => {

    // --- Cache DOM Elements ---
    const form = document.getElementById('queryForm');
    const baseUrlInput = document.getElementById('baseUrl');
    const toggleLockBtn = document.getElementById('toggleBaseUrlLock');
    const generatedUrlTextarea = document.getElementById('generatedUrl');
    const copyUrlButton = document.getElementById('copyUrlButton');
    const goToFbButton = document.getElementById('goToFbButton');

    // --- Define Structured Data (Enums) ---
    const selectOptions = {
        sortBy: {
            "": "Default (Best Match)",
            "best_match": "Best Match",
            "distance_ascend": "Distance: Nearest First",
            "creation_time_descend": "Date: Newest First",
            "price_ascend": "Price: Lowest First",
            "price_descend": "Price: Highest First"
        },
        daysSinceListed: {
            "": "Any Time",
            "1": "Last 24 Hours",
            "7": "Last 7 Days",
            "30": "Last 30 Days"
        },
        deliveryMethod: {
            "": "Any",
            "local_pick_up": "Local Pick-up",
            "shipping": "Shipping"
        },
        transmissionType: {
            "": "Any",
            "automatic": "Automatic",
            "manual": "Manual"
        }
    };

    /**
     * Populates <select> elements with options from the structured data.
     * This follows the DRY (Don't Repeat Yourself) principle.
     */
    function populateSelectOptions() {
        for (const [selectId, options] of Object.entries(selectOptions)) {
            const selectElement = document.getElementById(selectId);
            if (selectElement) {
                Object.entries(options).forEach(([value, text]) => {
                    const option = document.createElement('option');
                    option.value = value;
                    option.textContent = text;
                    selectElement.appendChild(option);
                });
            }
        }
    }

    /**
     * Main function to build the URL from form inputs.
     * This is the core logic.
     */
    function updateUrl() {
        const formData = new FormData(form);
        const params = new URLSearchParams();

        // Get all unique keys from the form
        const keys = new Set(Array.from(formData.keys()));

        for (const key of keys) {
            const element = form.elements[key];
            const allValues = formData.getAll(key); // Use getAll to handle multi-selects

            if (allValues.length === 0) continue;

            // Case 1: Single value field (text, number, select-one, or single checked box)
            if (allValues.length === 1) {
                const value = allValues[0];
                if (!value) continue; // Skip empty strings

                // Check if it's a boolean checkbox (value is "on" if checked)
                if (element && element.type === 'checkbox') {
                    params.set(key, 'true'); // Set boolean as 'true'
                }
                // Check if it's a comma-separated array input
                else if (element && element.dataset.array === 'comma') {
                    const values = value.split(',')
                        .map(s => s.trim()) // Clean whitespace
                        .filter(Boolean);    // Remove empty strings
                    values.forEach(v => params.append(key, v));
                }
                // Standard text, number, or select-one
                else {
                    params.set(key, value);
                }
            }
            // Case 2: Multi-value field (e.g., itemCondition checkboxes)
            else {
                allValues.forEach(v => {
                    if (v) params.append(key, v); // Add each value separately
                });
            }
        }

        const paramString = params.toString();

        // Ensure base URL has a trailing slash for safety
        let baseUrl = baseUrlInput.value;
        if (!baseUrl.endsWith('/')) {
            baseUrl += '/';
        }

        const finalUrl = baseUrl + (paramString ? `?${paramString}` : '');

        // Update the UI
        generatedUrlTextarea.value = finalUrl;
        goToFbButton.href = finalUrl;
    }

    /**
     * Toggles the readOnly state of the base URL input.
     */
    function toggleLock() {
        baseUrlInput.readOnly = !baseUrlInput.readOnly;
        toggleLockBtn.textContent = baseUrlInput.readOnly ? '🔓' : '🔒';
    }

    /**
     * Copies the generated URL to the clipboard.
     * Uses the modern, secure navigator.clipboard API.
     */
    async function copyUrl() {
        try {
            await navigator.clipboard.writeText(generatedUrlTextarea.value);
            copyUrlButton.textContent = 'Copied!';
            copyUrlButton.classList.add('copied');

            // Revert button text after 2 seconds
            setTimeout(() => {
                copyUrlButton.textContent = 'Copy URL';
                copyUrlButton.classList.remove('copied');
            }, 2000);
        } catch (err) {
            console.error('Security: Failed to copy text to clipboard.', err);
            // Provide fallback for older browsers or security errors
            alert('Failed to copy. Please copy manually.');
        }
    }

    // --- Attach Event Listeners ---

    // Use a single 'input' event listener on the form for high performance.
    // This captures changes from all inputs, selects, and textareas.
    form.addEventListener('input', updateUrl);

    toggleLockBtn.addEventListener('click', toggleLock);
    copyUrlButton.addEventListener('click', copyUrl);

    // --- Initial Setup ---
    populateSelectOptions();
    toggleLock(); // Set initial lock state
    updateUrl();  // Generate the URL on initial page load
});