/**
 * Sidebar Manager for 3D Editor
 * Manages sidebar panels, their visibility, and interactions
 */

class SidebarManager {
    constructor() {
        this.panels = [];
        this.activePanel = null;
    }

    /**
     * Initialize the sidebar manager
     */
    init() {
        this.setupPanelToggles();
        this.setupEventListeners();
    }

    /**
     * Register a panel with the sidebar manager
     * @param {string} panelId - The ID of the panel
     * @param {string} title - The title of the panel
     * @param {boolean} visible - Initial visibility state
     */
    registerPanel(panelId, title, visible = true) {
        this.panels.push({
            id: panelId,
            title: title,
            visible: visible
        });

        // Create panel structure if it doesn't exist
        this.ensurePanelStructure(panelId, title);
    }

    /**
     * Ensure the panel has the proper HTML structure
     * @param {string} panelId - The ID of the panel
     * @param {string} title - The title of the panel
     */
    ensurePanelStructure(panelId, title) {
        const panelElement = document.getElementById(panelId);
        if (!panelElement) return;

        // Check if panel already has the proper structure
        if (panelElement.querySelector('.panel-header')) return;

        // Create panel header
        const header = document.createElement('div');
        header.className = 'panel-header';

        const titleDiv = document.createElement('div');
        titleDiv.className = 'panel-title';

        const titleElement = document.createElement('h3');
        titleElement.textContent = title;

        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'toggle-btn';
        toggleBtn.innerHTML = '<i class="fas fa-minus"></i>';

        titleDiv.appendChild(titleElement);
        titleDiv.appendChild(toggleBtn);
        header.appendChild(titleDiv);

        // Create panel content wrapper
        const content = document.createElement('div');
        content.className = 'panel-content';

        // Move existing content to the content wrapper
        while (panelElement.firstChild) {
            content.appendChild(panelElement.firstChild);
        }

        // Add header and content to panel
        panelElement.prepend(header);
        panelElement.appendChild(content);
    }

    /**
     * Set up panel toggle functionality
     */
    setupPanelToggles() {
        const toggleButtons = document.querySelectorAll('.toggle-btn');
        toggleButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                this.togglePanel(button);
            });
        });
    }

    /**
     * Toggle a panel's visibility
     * @param {HTMLElement} toggleButton - The toggle button element
     */
    togglePanel(toggleButton) {
        const panel = toggleButton.closest('.control-group');
        const content = panel.querySelector('.panel-content');

        if (content) {
            const isVisible = content.style.display !== 'none';
            content.style.display = isVisible ? 'none' : 'flex';
            toggleButton.classList.toggle('minimized', !isVisible);
        }
    }

    /**
     * Set up additional event listeners
     */
    setupEventListeners() {
        // Add any additional sidebar-wide event listeners here
    }

    /**
     * Get all registered panels
     * @returns {Array} Array of panel objects
     */
    getAllPanels() {
        return this.panels;
    }

    /**
     * Get a panel by ID
     * @param {string} panelId - The ID of the panel to get
     * @returns {Object|null} The panel object or null if not found
     */
    getPanel(panelId) {
        return this.panels.find(panel => panel.id === panelId) || null;
    }

    /**
     * Set the active panel
     * @param {string} panelId - The ID of the panel to activate
     */
    setActivePanel(panelId) {
        this.activePanel = panelId;
    }

    /**
     * Get the active panel
     * @returns {string|null} The ID of the active panel or null if none
     */
    getActivePanel() {
        return this.activePanel;
    }
}

// Export singleton instance
const sidebarManager = new SidebarManager();
export { sidebarManager };