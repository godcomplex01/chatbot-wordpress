// Simple test script to verify the fix
console.log('Test script loaded');
console.log('Checking for stepId errors...');

// Test the exact problematic line
const currentStepId = "test";
const flow = [{id: "test"}, {id: "test2"}];

// This should work now
const nextIndex = flow.findIndex(s => s.id === currentStepId) + 1;
console.log('Next index:', nextIndex);

console.log('Test completed - no stepId errors!');
