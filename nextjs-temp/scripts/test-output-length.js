// Test script to verify Output Length functionality
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const fetch = require('node-fetch');

// Paths are relative to the project root
const TEST_FILE_PATH = path.join(__dirname, '..', 'test-document.md');

// Check if test file exists
if (!fs.existsSync(TEST_FILE_PATH)) {
    console.error(`Test file not found: ${TEST_FILE_PATH}`);
    console.error('Creating a simple test document for analysis...');

    // Create a simple test document
    const sampleContent = `# Sample Test Document

This is a sample document created for testing the output length feature in Sonne. 
This document contains information about artificial intelligence and its applications.

## Introduction to AI

Artificial intelligence (AI) is intelligence demonstrated by machines, as opposed to natural intelligence displayed by animals including humans.
AI applications include advanced web search engines, recommendation systems, understanding human speech, self-driving cars, 
automated decision-making and competing at the highest level in strategic game systems.

## Types of AI

1. **Narrow AI**: Designed and trained for a specific task. Examples include virtual personal assistants like Siri and Alexa.
2. **General AI**: A hypothetical machine with the ability to apply intelligence to any problem, rather than just one specific problem.
3. **Superintelligent AI**: AI that surpasses human intelligence and abilities in nearly all economically valuable tasks.

## Applications of AI

AI is transforming various industries including healthcare, finance, transportation, and education. 
In healthcare, AI algorithms can help in early diagnosis of diseases through pattern recognition in medical images.
Financial institutions use AI for fraud detection, risk assessment, and algorithmic trading.
Self-driving cars represent one of the most visible applications of AI in transportation.
Educational platforms leverage AI to provide personalized learning experiences based on student performance and preferences.

## Ethical Considerations

As AI systems become more prevalent, important ethical questions arise:
- Privacy concerns regarding data collection and usage
- Potential job displacement due to automation
- Decision-making transparency and accountability
- Bias and fairness in AI algorithms
- Security vulnerabilities and potential misuse

## Future Outlook

The future of AI promises continued advancements in machine learning, natural language processing, and robotics.
As these technologies evolve, collaboration between researchers, policymakers, and industry leaders will be essential
to ensure that AI development aligns with human values and benefits society as a whole.`;

    fs.writeFileSync(TEST_FILE_PATH, sampleContent);
    console.log('Test document created successfully.');
}

// Function to run analysis with specific output length setting
async function runAnalysis(outputLength) {
    console.log(`Running analysis with output length: ${outputLength}...`);

    // Read test file
    const fileContent = fs.readFileSync(TEST_FILE_PATH);
    const fileName = path.basename(TEST_FILE_PATH);

    // Create form data
    const formData = new FormData();
    formData.append('pdfFiles', new Blob([fileContent]), fileName);
    formData.append('outputLength', outputLength.toString());

    // Send request to analyze endpoint
    const response = await fetch('http://localhost:3000/api/analyze-complete', {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
    }

    return await response.json();
}

// Function to count words in a string
function countWords(text) {
    return text.trim().split(/\s+/).length;
}

// Function to count characters in a string
function countChars(text) {
    return text.trim().length;
}

// Run test function
async function runTest() {
    try {
        console.log('Starting output length test...');

        // Test with minimum length (brief output)
        const briefResult = await runAnalysis(100);

        // Test with maximum length (detailed output)
        const detailedResult = await runAnalysis(1000);

        // Compare results
        const briefSummaryWords = countWords(briefResult.summary);
        const detailedSummaryWords = countWords(detailedResult.summary);

        const briefAnalysisWords = countWords(briefResult.detailedAnalysis);
        const detailedAnalysisWords = countWords(detailedResult.detailedAnalysis);

        const briefKeyPointsCount = briefResult.keyPoints.length;
        const detailedKeyPointsCount = detailedResult.keyPoints.length;

        console.log('\n=== TEST RESULTS ===');
        console.log('Brief Summary (Output Length = 100):');
        console.log(`- Words: ${briefSummaryWords}`);
        console.log(`- Characters: ${countChars(briefResult.summary)}`);
        console.log(`- Key Points: ${briefKeyPointsCount}`);
        console.log(`- Detailed Analysis Words: ${briefAnalysisWords}`);

        console.log('\nDetailed Summary (Output Length = 1000):');
        console.log(`- Words: ${detailedSummaryWords}`);
        console.log(`- Characters: ${countChars(detailedResult.summary)}`);
        console.log(`- Key Points: ${detailedKeyPointsCount}`);
        console.log(`- Detailed Analysis Words: ${detailedAnalysisWords}`);

        console.log('\nComparison:');
        const summaryRatio = detailedSummaryWords / briefSummaryWords;
        const analysisRatio = detailedAnalysisWords / briefAnalysisWords;
        console.log(`- Summary Size Ratio (Detailed:Brief): ${summaryRatio.toFixed(2)}x`);
        console.log(`- Analysis Size Ratio (Detailed:Brief): ${analysisRatio.toFixed(2)}x`);
        console.log(`- Key Points Count Difference: ${detailedKeyPointsCount - briefKeyPointsCount}`);

        // Check if there's a significant difference
        const hasSignificantDifference =
            summaryRatio > 1.5 ||
            analysisRatio > 1.5 ||
            detailedKeyPointsCount > briefKeyPointsCount;

        if (hasSignificantDifference) {
            console.log('\n✅ TEST PASSED: Output length setting is working correctly!');
            console.log('The detailed output is significantly longer than the brief output.');
        } else {
            console.log('\n❌ TEST FAILED: Output length setting may not be working correctly.');
            console.log('There is not a significant difference between brief and detailed outputs.');
        }

    } catch (error) {
        console.error('Test error:', error);
    }
}

// Run the test
runTest();
