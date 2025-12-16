/**
 * Test script for layer controls functionality
 * This script tests the moveLayerUp and moveLayerDown methods
 */

// Import the layerManager
import { layerManager } from './layerManager.js';

// Test the layer movement functionality
function testLayerControls() {
    console.log('Testing layer controls...');

    // Add some test layers
    layerManager.addLayer('Layer 2');
    layerManager.addLayer('Layer 3');
    layerManager.addLayer('Layer 4');

    console.log('Initial layer order:');
    layerManager.getAllLayers().forEach((layer, index) => {
        console.log(`${index}: ${layer.name} (ID: ${layer.id})`);
    });

    // Test moving layer up
    console.log('\nTesting moveLayerUp on Layer 3 (ID: 3):');
    const moveUpSuccess = layerManager.moveLayerUp(3);
    console.log(`Move up successful: ${moveUpSuccess}`);

    console.log('Layer order after moving Layer 3 up:');
    layerManager.getAllLayers().forEach((layer, index) => {
        console.log(`${index}: ${layer.name} (ID: ${layer.id})`);
    });

    // Test moving layer down
    console.log('\nTesting moveLayerDown on Layer 2 (ID: 2):');
    const moveDownSuccess = layerManager.moveLayerDown(2);
    console.log(`Move down successful: ${moveDownSuccess}`);

    console.log('Layer order after moving Layer 2 down:');
    layerManager.getAllLayers().forEach((layer, index) => {
        console.log(`${index}: ${layer.name} (ID: ${layer.id})`);
    });

    // Test moving top layer up (should fail)
    console.log('\nTesting moveLayerUp on top layer (should fail):');
    const topLayer = layerManager.getAllLayers()[0];
    const topMoveUpSuccess = layerManager.moveLayerUp(topLayer.id);
    console.log(`Move top layer up successful: ${topMoveUpSuccess}`);

    // Test moving bottom layer down (should fail)
    console.log('\nTesting moveLayerDown on bottom layer (should fail):');
    const bottomLayer = layerManager.getAllLayers()[layerManager.getAllLayers().length - 1];
    const bottomMoveDownSuccess = layerManager.moveLayerDown(bottomLayer.id);
    console.log(`Move bottom layer down successful: ${bottomMoveDownSuccess}`);

    console.log('\nLayer controls test completed!');
}

// Run the test
testLayerControls();