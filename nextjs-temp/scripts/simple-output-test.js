#!/usr/bin/env node

// Simple test script to verify Output Length functionality
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

console.log('Starting Output Length test...');

// Create a simple test document if it doesn't exist
const testDocPath = path.join(__dirname, '..', 'test-document.md');
console.log(`Using test document: ${testDocPath}`);

if (!fs.existsSync(testDocPath)) {
    console.log('Test document not found, creating one...');
    const testContent = `# Test Document
  
This is a sample document for testing the output length feature.
It contains enough text to analyze but is intentionally kept simple.

## Section 1

Artificial intelligence (AI) is intelligence demonstrated by machines.
Machine learning is a subset of AI focused on building systems that learn from data.
Deep learning is a type of machine learning based on artificial neural networks.

## Section 2

Natural language processing (NLP) allows computers to understand human language.
Computer vision is the field of AI that enables computers to derive meaningful information from digital images and videos.
Robotics combines AI with mechanical engineering to create machines that can interact with the physical world.
`;

    fs.writeFileSync(testDocPath, testContent);
    console.log('Test document created successfully.');
}

// Function to manually send a request using Node's built-in http module
function sendRequest(outputLength) {
    return new Promise((resolve, reject) => {
        console.log(`\nSending request with output length: ${outputLength}`);

        // Read the test file
        const fileContent = fs.readFileSync(testDocPath, 'utf8');

        // Generate a unique boundary string
        const boundary = '----WebKitFormBoundary' + Math.random().toString(16).substring(2);

        // Create multipart/form-data content manually
        let requestBody = '';

        // Add file part
        requestBody += `--${boundary}\r\n`;
        requestBody += 'Content-Disposition: form-data; name="pdfFiles"; filename="test-document.md"\r\n';
        requestBody += 'Content-Type: text/markdown\r\n\r\n';
        requestBody += fileContent;
        requestBody += '\r\n';

        // Add outputLength part
        requestBody += `--${boundary}\r\n`;
        requestBody += `Content-Disposition: form-data; name="outputLength"\r\n\r\n`;
        requestBody += `${outputLength}\r\n`;

        // End boundary
        requestBody += `--${boundary}--\r\n`;

        // Request options
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: '/api/analyze-complete',
            method: 'POST',
            headers: {
                'Content-Type': `multipart/form-data; boundary=${boundary}`,
                'Content-Length': Buffer.byteLength(requestBody)
            }
        };

        console.log('Sending analysis request...');

        // Make the request
        const req = http.request(options, (res) => {
            console.log(`Response status: ${res.statusCode}`);

            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    try {
                        const result = JSON.parse(data);
                        resolve(result);
                    } catch (error) {
                        console.error('Error parsing JSON response:', error);
                        reject(error);
                    }
                } else {
                    console.error(`Request failed with status: ${res.statusCode}`);
                    console.error('Response data:', data);
                    reject(new Error(`Request failed with status: ${res.statusCode}`));
                }
            });
        });

        req.on('error', (error) => {
            console.error('Request error:', error);
            reject(error);
        });

        // Send the request
        req.write(requestBody);
        req.end();
    });
}

// Function to measure text length
function countWords(text) {
    return text.trim().split(/\s+/).length;
}

// Function to count characters
function countChars(text) {
    return text.length;
}

// Main test function
async function runTest() {
    try {
        // Test with minimum length (100)
        console.log('\n=== Testing with BRIEF setting (outputLength=100) ===');
        const briefResult = await sendRequest(100);
        console.log('Brief analysis received successfully');

        // Test with maximum length (1000)
        console.log('\n=== Testing with DETAILED setting (outputLength=1000) ===');
        const detailedResult = await sendRequest(1000);
        console.log('Detailed analysis received successfully');

        // Compare results
        console.log('\n=== COMPARISON RESULTS ===');

        console.log('\n--- Summary Section ---');
        const briefSummaryWords = countWords(briefResult.summary);
        const detailedSummaryWords = countWords(detailedResult.summary);
        console.log(`Brief summary: ${briefSummaryWords} words, ${countChars(briefResult.summary)} chars`);
        console.log(`Detailed summary: ${detailedSummaryWords} words, ${countChars(detailedResult.summary)} chars`);
        console.log(`Ratio (detailed:brief): ${(detailedSummaryWords / briefSummaryWords).toFixed(2)}x`);

        console.log('\n--- Key Points ---');
        console.log(`Brief key points: ${briefResult.keyPoints.length} points`);
        console.log(`Detailed key points: ${detailedResult.keyPoints.length} points`);
        console.log(`Difference: ${detailedResult.keyPoints.length - briefResult.keyPoints.length} points`);

        console.log('\n--- Detailed Analysis ---');
        const briefAnalysisWords = countWords(briefResult.detailedAnalysis);
        const detailedAnalysisWords = countWords(detailedResult.detailedAnalysis);
        console.log(`Brief analysis: ${briefAnalysisWords} words`);
        console.log(`Detailed analysis: ${detailedAnalysisWords} words`);
        console.log(`Ratio (detailed:brief): ${(detailedAnalysisWords / briefAnalysisWords).toFixed(2)}x`);

        // Overall assessment
        const summaryRatio = detailedSummaryWords / briefSummaryWords;
        const analysisRatio = detailedAnalysisWords / briefAnalysisWords;
        const keyPointsDiff = detailedResult.keyPoints.length - briefResult.keyPoints.length;

        console.log('\n=== FINAL ASSESSMENT ===');
        console.log(`Summary ratio: ${summaryRatio.toFixed(2)}x`);
        console.log(`Analysis ratio: ${analysisRatio.toFixed(2)}x`);
        console.log(`Key points difference: ${keyPointsDiff}`);

        const isSignificant = (
            summaryRatio > 1.3 ||
            analysisRatio > 1.3 ||
            keyPointsDiff > 0
        );

        if (isSignificant) {
            console.log('\n✅ TEST PASSED: Output length setting is working correctly!');
            console.log('The detailed output is significantly longer than the brief output.');
        } else {
            console.log('\n❌ TEST FAILED: Output length setting may not be working correctly.');
            console.log('There is not a significant difference between brief and detailed outputs.');
        }

    } catch (error) {
        console.error('\n❌ TEST ERROR:', error.message);
    }
}

// Run the test
runTest();
