/**
 * TutorialConfig — pixelKanban
 *
 * Defines the step-by-step onboarding tutorial for the Kanban board.
 *
 * Each step supports:
 *   elementId        — ID of the element to highlight (or null for centre modal)
 *   selector         — CSS selector fallback when no ID is set
 *   position         — 'top' | 'bottom' | 'left' | 'right' | 'center'
 *   arrowPosition    — which side of the tooltip box the arrow appears on
 *   arrowOffset      — 'start' | 'center' | 'end' (default 'center')
 *   marginOverride   — extra px gap between tooltip and target
 *   heading          — tooltip heading text
 *   content          — tooltip body text
 */

class TutorialConfig {
    constructor() {
        this.tutorials = {
            main: {
                enabled: false, // Default to off as requested
                steps: [
                    {
                        id: 'welcome',
                        elementId: null,
                        position: 'center',
                        heading: 'Welcome to Isometric Terrain Builder! 🏗️',
                        content: 'Create beautiful 3D isometric scenes with this powerful terrain builder. This tutorial will guide you through the main features. Use the arrow keys or buttons below to navigate.',
                    },
                    {
                        id: 'sidebar',
                        selector: '#sidebar',
                        position: 'left',
                        marginOverride: 20,
                        heading: 'Control Panel',
                        content: 'The sidebar contains all your tools organized in tabs: Objects for adding 3D elements, Movement for positioning, Camera controls, Scene settings, and more.',
                    },
                    {
                        id: 'objects',
                        elementId: 'add-cube',
                        position: 'left',
                        marginOverride: 15,
                        heading: 'Adding Objects',
                        content: 'Start by adding objects to your scene. Click the cube, sphere, cylinder, or other buttons to place 3D objects. They will spawn at the cursor indicator position.',
                    },
                    {
                        id: 'cursor-tool',
                        elementId: 'objects-panel',
                        position: 'left',
                        marginOverride: 15,
                        heading: 'Cursor Tool',
                        content: 'Use the cursor tool (bottom of sidebar) to precisely place objects. Hover to see a preview crosshair, then click to set the spawn point for new objects.',
                    },
                    {
                        id: 'movement',
                        elementId: 'move-up',
                        position: 'left',
                        marginOverride: 15,
                        heading: 'Moving Objects',
                        content: 'Select objects by clicking them, then use the movement arrows to position them precisely on the grid. Objects snap to grid lines automatically.',
                    },
                    {
                        id: 'camera',
                        elementId: 'rotate-cw',
                        position: 'left',
                        marginOverride: 15,
                        heading: 'Camera Controls',
                        content: 'Use the camera rotation buttons to view your scene from different isometric angles. The grid and objects always maintain proper isometric perspective.',
                    },
                    {
                        id: 'scene-settings',
                        elementId: 'toggle-grid',
                        position: 'left',
                        marginOverride: 15,
                        heading: 'Scene Controls',
                        content: 'Toggle the grid and axes visibility, change backgrounds, adjust lighting, and apply themes. The scene panel gives you full control over your environment.',
                    },
                    {
                        id: 'properties',
                        elementId: 'object-color',
                        position: 'left',
                        marginOverride: 15,
                        heading: 'Object Properties',
                        content: 'Customize individual objects with colors, scaling, rotation, and layering. Changes apply immediately to selected objects.',
                    },
                    {
                        id: 'export',
                        elementId: 'export-obj',
                        position: 'left',
                        marginOverride: 15,
                        heading: 'Export Options',
                        content: 'Export your creations as OBJ, STL, or Unity-compatible files. Include collision data and choose the format that works best for your project.',
                    },
                    {
                        id: 'settings',
                        elementId: 'settings-btn',
                        position: 'top',
                        marginOverride: 15,
                        heading: 'Settings',
                        content: 'Access comprehensive settings for grid appearance, scene defaults, export options, and tutorial preferences. Your settings are automatically saved.',
                    },
                    {
                        id: 'done',
                        elementId: null,
                        position: 'center',
                        heading: "You're ready to build! 🎉",
                        content: "That's the basics of the Isometric Terrain Builder. Experiment with different objects, lighting, and themes to create amazing 3D scenes. You can restart this tutorial anytime from Settings → Tutorial.",
                    },
                ],
            },
        };

        // ── Runtime state ──────────────────────────────────────────────────
        this.currentTutorial = 'main';
        this.currentStep     = 0;
        this.isActive        = false;
    }

    // ── Tutorial management ────────────────────────────────────────────────

    addTutorial(id, config) { this.tutorials[id] = config; }

    getTutorial(id) { return this.tutorials[id] || null; }

    startTutorial(id) {
        if (!this.tutorials[id]) return;
        this.currentTutorial = id;
        this.currentStep     = 0;
        this.isActive        = true;
    }

    stopTutorial()      { this.isActive = false; }
    isTutorialActive()  { return this.isActive; }

    // ── Step navigation ────────────────────────────────────────────────────

    getCurrentStep() {
        const t = this.getTutorial(this.currentTutorial);
        if (!t || this.currentStep >= t.steps.length) return null;
        return t.steps[this.currentStep];
    }

    nextStep() {
        const t = this.getTutorial(this.currentTutorial);
        if (!t) return null;
        this.currentStep++;
        if (this.currentStep >= t.steps.length) return null;
        return this.getCurrentStep();
    }

    prevStep() {
        if (this.currentStep <= 0) return null;
        this.currentStep--;
        return this.getCurrentStep();
    }

    resetTutorial() { this.currentStep = 0; }

    get totalSteps() {
        const t = this.getTutorial(this.currentTutorial);
        return t ? t.steps.length : 0;
    }
}
