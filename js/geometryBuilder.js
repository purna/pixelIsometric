/**
 * Geometry Builder for Isometric Objects
 *
 * Stage 1 additions:
 *   - createRamp      (was referenced in objectManager but never defined — caused silent crash)
 *   - createStairs    (staircase as a series of stepped BoxGeometries merged into a Group)
 *   - createRoof      (hip-roof / pyramid shape via ExtrudeGeometry)
 *   - createPyramid   (pure pyramid for decorative use)
 *   - createBridge    (deck + two pier supports)
 *
 * All existing methods are unchanged.
 */
class GeometryBuilder {

    /* ------------------------------------------------------------------ */
    /*  EXISTING METHODS (unchanged)                                        */
    /* ------------------------------------------------------------------ */

    static createTerrain(options) {
        options = options || {};
        const width  = options.width  || 1;
        const length = options.length || 1;
        const height = options.height || 0.25;

        const geometry = new THREE.PlaneGeometry(width, length, 1, 1);
        const positions = geometry.attributes.position;
        for (let i = 0; i < positions.count; i++) {
            positions.setY(i, height);
        }
        geometry.computeVertexNormals();
        geometry.rotateX(-Math.PI / 2);
        return geometry;
    }

    static createWall(options) {
        options = options || {};
        const width  = options.width  || 1;
        const height = options.height || 2;
        const depth  = options.depth  || 0.2;
        return new THREE.BoxGeometry(width, height, depth);
    }

    /**
     * Building returns a THREE.Group (main body + flat roof cap).
     * Stage-1 note: exportManager must traverse Groups — see exportManager.js fix.
     */
    static createBuilding(options) {
        options = options || {};
        const width  = options.width  || 2;
        const height = options.height || 3;
        const depth  = options.depth  || 2;

        const group = new THREE.Group();
        group.userData.isBuilding = true;

        const mainGeom = new THREE.BoxGeometry(width, height, depth);
        mainGeom.translate(0, height / 2, 0);
        group.add(new THREE.Mesh(mainGeom));

        const roofGeom = new THREE.BoxGeometry(width + 0.05, 0.1, depth + 0.05);
        roofGeom.translate(0, height + 0.05, 0);
        group.add(new THREE.Mesh(roofGeom));

        return group;
    }

    static createPath(options) {
        options = options || {};
        const width     = options.width     || 1;
        const length    = options.length    || 1;
        const thickness = options.thickness || 0.05;
        const geometry  = new THREE.BoxGeometry(width, thickness, length);
        geometry.translate(0, thickness / 2, 0);
        return geometry;
    }

    static createRiver(options) {
        options = options || {};
        const width     = options.width     || 1;
        const length    = options.length    || 1;
        const thickness = options.thickness || 0.05;

        const shape = new THREE.Shape();
        shape.moveTo(-width / 2, 0);
        shape.quadraticCurveTo(0,  length / 2,  width / 2, 0);
        shape.quadraticCurveTo(0, -length / 2, -width / 2, 0);

        const extrudeSettings = { depth: thickness, bevelEnabled: false, steps: 1 };
        const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        geometry.rotateX(-Math.PI / 2);
        geometry.translate(0, thickness / 2, 0);
        return geometry;
    }

    static generatePlanarUV(geometry, tileRepeat) {
        tileRepeat = tileRepeat || 1;
        const uvAttr = geometry.attributes.position;
        const uvs = [];
        for (let i = 0; i < uvAttr.count; i++) {
            const x = uvAttr.getX(i);
            const z = uvAttr.getZ(i);
            uvs.push(x * tileRepeat, z * tileRepeat);
        }
        geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    }

    /* ------------------------------------------------------------------ */
    /*  NEW: createRamp                                                     */
    /* ------------------------------------------------------------------ */

    /**
     * Creates a wedge/ramp geometry using ExtrudeGeometry.
     *
     * The ramp rises from z = +depth/2 (low end, y=0) to z = -depth/2
     * (high end, y=height).  Sit it on the ground plane — no translation needed.
     *
     * @param {object} options
     * @param {number} options.width  - X extent (default 1)
     * @param {number} options.height - Rise height  (default 0.5)
     * @param {number} options.depth  - Run / Z extent (default 1)
     */
    static createRamp(options) {
        options = options || {};
        const width  = options.width  || 1;
        const height = options.height || 0.5;
        const depth  = options.depth  || 1;

        // Right-triangle profile in the Y-Z plane (extruded along X)
        const shape = new THREE.Shape();
        shape.moveTo(0,      0);      // front-bottom
        shape.lineTo(depth,  0);      // back-bottom
        shape.lineTo(0,      height); // front-top (the slope goes back-to-front)
        shape.closePath();

        const extrudeSettings = {
            steps:         1,
            depth:         width,
            bevelEnabled:  false
        };

        const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);

        // ExtrudeGeometry extrudes along Z; rotate so it extrudes along X
        // and lies flat on Y=0.
        geometry.rotateY(-Math.PI / 2);

        // Centre on origin X, keep Z so the low end is at +Z and high at -Z
        geometry.translate(width / 2, 0, depth / 2);

        geometry.computeVertexNormals();
        return geometry;
    }

    /* ------------------------------------------------------------------ */
    /*  NEW: createStairs                                                   */
    /* ------------------------------------------------------------------ */

    /**
     * Returns a THREE.Group of stacked boxes that form a staircase.
     *
     * Each step is one unit wide (X), one step-height tall, and one step-depth
     * deep (Z).  Steps rise in +Y and recede in +Z.
     *
     * @param {object} options
     * @param {number} options.steps      - Number of steps (default 4)
     * @param {number} options.width      - X extent per step (default 1)
     * @param {number} options.stepHeight - Height of each step (default 0.25)
     * @param {number} options.stepDepth  - Depth  of each step (default 0.5)
     */
    static createStairs(options) {
        options = options || {};
        const numSteps  = options.steps      || 4;
        const width     = options.width      || 1;
        const stepH     = options.stepHeight || 0.25;
        const stepD     = options.stepDepth  || 0.5;

        const group = new THREE.Group();
        group.userData.isStairs = true;

        for (let i = 0; i < numSteps; i++) {
            // Each successive step is a full column from the ground up so that
            // the side profile looks solid (no gaps underneath).
            const colHeight = stepH * (i + 1);
            const geom = new THREE.BoxGeometry(width, colHeight, stepD);

            // Position: advance in Z, sit base on Y=0
            const mesh = new THREE.Mesh(geom);
            mesh.position.set(0, colHeight / 2, i * stepD);
            group.add(mesh);
        }

        // Centre the whole staircase on X=0, Z=0
        const totalDepth = numSteps * stepD;
        group.children.forEach(child => {
            child.position.z -= totalDepth / 2;
        });

        return group;
    }

    /* ------------------------------------------------------------------ */
    /*  NEW: createRoof (hip roof)                                          */
    /* ------------------------------------------------------------------ */

    /**
     * Creates a hip-roof (four-sided pitched roof) using a BufferGeometry
     * built from two quads + two triangles.
     *
     * The roof sits at Y=0 (caller should translate it to the top of the wall).
     *
     * @param {object} options
     * @param {number} options.width  - Base X extent (default 2)
     * @param {number} options.depth  - Base Z extent (default 2)
     * @param {number} options.height - Ridge height   (default 0.8)
     * @param {number} options.overhang - Extra overhang beyond base (default 0.1)
     */
    static createRoof(options) {
        options = options || {};
        const w  = (options.width    || 2) / 2;   // half-width
        const d  = (options.depth    || 2) / 2;   // half-depth
        const h  =  options.height   || 0.8;
        const ov =  options.overhang || 0.1;

        // Eave corners (slightly larger than base for overhang)
        const ew = w + ov;
        const ed = d + ov;

        // Vertices:
        // 0: front-left eave,  1: front-right eave
        // 2: back-right eave,  3: back-left  eave
        // 4: ridge-left,       5: ridge-right  (ridge runs along X)
        const ridgeOffset = w * 0.4; // ridge is shorter than full width for hip effect

        const positions = new Float32Array([
            -ew, 0,  ed,   // 0
             ew, 0,  ed,   // 1
             ew, 0, -ed,   // 2
            -ew, 0, -ed,   // 3
            -ridgeOffset, h, 0,  // 4  ridge-left
             ridgeOffset, h, 0   // 5  ridge-right
        ]);

        // Faces (two quads split into triangles + two end triangles)
        const indices = [
            // Front slope  (0,1,5,4)
            0, 1, 5,
            0, 5, 4,
            // Back slope   (3,2 → 5,4 reversed)
            2, 3, 4,
            2, 4, 5,
            // Right hip    (1,2,5)
            1, 2, 5,
            // Left hip     (3,0,4)
            3, 0, 4
        ];

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setIndex(indices);
        geometry.computeVertexNormals();

        // Generate simple planar UVs
        GeometryBuilder.generatePlanarUV(geometry, 1);

        return geometry;
    }

    /* ------------------------------------------------------------------ */
    /*  NEW: createPyramid                                                  */
    /* ------------------------------------------------------------------ */

    /**
     * Creates a four-sided pyramid (good for towers, obelisks).
     * Sits with base at Y=0.
     *
     * @param {object} options
     * @param {number} options.base   - Base side length (default 1)
     * @param {number} options.height - Apex height      (default 1.5)
     */
    static createPyramid(options) {
        options = options || {};
        const b = (options.base   || 1) / 2;  // half-base
        const h =  options.height || 1.5;

        const positions = new Float32Array([
            -b, 0,  b,   // 0 front-left
             b, 0,  b,   // 1 front-right
             b, 0, -b,   // 2 back-right
            -b, 0, -b,   // 3 back-left
             0, h,  0    // 4 apex
        ]);

        const indices = [
            // Base (two triangles)
            0, 2, 1,
            0, 3, 2,
            // Four sides
            0, 1, 4,
            1, 2, 4,
            2, 3, 4,
            3, 0, 4
        ];

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setIndex(indices);
        geometry.computeVertexNormals();
        GeometryBuilder.generatePlanarUV(geometry, 1);
        return geometry;
    }

    /* ------------------------------------------------------------------ */
    /*  NEW: createBridge                                                   */
    /* ------------------------------------------------------------------ */

    /**
     * Returns a THREE.Group containing a flat deck and two pier supports.
     * The bridge spans along the Z axis.
     *
     * @param {object} options
     * @param {number} options.width       - Deck X width   (default 1)
     * @param {number} options.span        - Deck Z length  (default 3)
     * @param {number} options.deckHeight  - Deck thickness (default 0.15)
     * @param {number} options.pierHeight  - Pier height    (default 1)
     * @param {number} options.pierWidth   - Pier X/Z size  (default 0.2)
     * @param {number} options.clearance   - Gap under deck (default 0.5)
     */
    static createBridge(options) {
        options = options || {};
        const width      = options.width      || 1;
        const span       = options.span       || 3;
        const deckH      = options.deckHeight || 0.15;
        const pierH      = options.pierHeight || 1;
        const pierW      = options.pierWidth  || 0.2;
        const clearance  = options.clearance  || 0.5;

        const group = new THREE.Group();
        group.userData.isBridge = true;

        // Deck — flat box, raised above ground by clearance + pierH
        const deckY = pierH + clearance + deckH / 2;
        const deckGeom = new THREE.BoxGeometry(width, deckH, span);
        const deck = new THREE.Mesh(deckGeom);
        deck.position.set(0, deckY, 0);
        group.add(deck);

        // Two piers — placed at ±(span/2 - 0.3) along Z
        const pierOffset = span / 2 - 0.3;
        [-pierOffset, pierOffset].forEach(zPos => {
            const pierGeom = new THREE.BoxGeometry(pierW, pierH + clearance, pierW);
            const pier = new THREE.Mesh(pierGeom);
            pier.position.set(0, (pierH + clearance) / 2, zPos);
            group.add(pier);
        });

        return group;
    }
}

export { GeometryBuilder };
