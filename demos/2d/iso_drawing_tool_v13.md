# 2D Isometric Layered Engine (v13)

A vector-based 2D isometric drawing workspace utilizing nested HTML5 canvas instances to render layered geometric blocks, depth sorting, and path colliders.

### Core Architecture Features
* **Multi-Canvas Layer Stacking:** Employs independent canvas nodes (`#c-grid`, `#c-cube`, `#c-col`, `#c-hit`) to segment coordinate grids from voxel data.
* **Dynamic Material Customization:** Integrated sidebar containing properties inspector sliders to modify nested color channels and opacities.
* **Camera Coordinate Rotation:** Custom transformation pipeline shifting vertex mapping arrays clockwise or counterclockwise by 90 degrees.
* **Voxel Height Adjuster:** Vertical index incrementation controller shifting active project baselines.

### Stamps & Layout System Features
* **Custom Presets Capture:** Evaluates active dictionary arrays to capture and clone visual layout models instantly.
* **Asynchronous Mini-Previews:** Automatically scales structural matrix points to generate icon graphics inside the asset tray.
* **Dynamic Placement Grid:** Features a complete 2D layout grid with responsive pointer tracking, cell snap previews, and stamp asset layering.
* **Toggle Erase Interaction:** Tracks specific grid cells to overwrite an existing stamp index if a layout vector matches.