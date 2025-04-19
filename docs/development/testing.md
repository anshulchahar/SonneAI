# Testing Guide

This guide provides information about testing the Sonne application.

## Test Structure

The Sonne test suite is divided into several categories:

- **Unit Tests**: Test individual components in isolation
- **Integration Tests**: Test interactions between multiple components
- **End-to-End Tests**: Test complete application workflows

## Running Tests

### Prerequisites

Ensure you have all development dependencies installed:

```bash
pip install -r requirements.txt
```

### Running the Test Suite

To run the entire test suite:

```bash
pytest
```

### Running Specific Test Categories

To run only unit tests:

```bash
pytest tests/unit/
```

To run only integration tests:

```bash
pytest tests/integration/
```

### Test Coverage

To run tests with coverage reporting:

```bash
pytest --cov=. tests/
```

For a detailed HTML coverage report:

```bash
pytest --cov=. --cov-report=html tests/
```

The HTML report will be available in the `htmlcov` directory.

## Writing Tests

### Unit Test Example

Here's an example of a unit test for the PDF processor:

```python
# tests/unit/test_pdf_processor.py
import pytest
from pdf_processor import extract_text

def test_extract_text():
    # Setup test data
    test_file = "tests/fixtures/sample.pdf"
    
    # Call the function
    result = extract_text(test_file)
    
    # Assert expectations
    assert isinstance(result, str)
    assert "Expected sample text" in result
    assert len(result) > 0
```

### Integration Test Example

Here's an example of an integration test:

```python
# tests/integration/test_analysis_workflow.py
import pytest
from pdf_processor import extract_text
from gemini_api_handler import analyze_text

def test_document_analysis_workflow():
    # Extract text from test document
    test_file = "tests/fixtures/sample.pdf"
    text = extract_text(test_file)
    
    # Pass the extracted text to the Gemini API handler
    analysis = analyze_text(text, analysis_type="summary")
    
    # Assert expectations
    assert "summary" in analysis
    assert len(analysis["summary"]) > 0
```

## Mock Testing

For tests that require API calls, we use mocks to avoid real API calls during testing:

```python
# tests/unit/test_gemini_api.py
import pytest
from unittest.mock import patch
from gemini_api_handler import analyze_text

@patch("gemini_api_handler.google.generativeai.GenerativeModel")
def test_analyze_text_with_mock(mock_generative_model):
    # Set up the mock
    mock_instance = mock_generative_model.return_value
    mock_instance.generate_content.return_value.text = "Mocked summary"
    
    # Call the function
    result = analyze_text("This is some test content", analysis_type="summary")
    
    # Assert expectations
    assert result["summary"] == "Mocked summary"
    mock_instance.generate_content.assert_called_once()
```

## Test Fixtures

We use pytest fixtures to set up test data and dependencies:

```python
# tests/conftest.py
import pytest
import tempfile
import os

@pytest.fixture
def sample_pdf_file():
    """Fixture that provides a path to a sample PDF file."""
    # Return path to a test fixture file
    return os.path.join(os.path.dirname(__file__), "fixtures", "sample.pdf")
    
@pytest.fixture
def mock_gemini_api():
    """Fixture that mocks the Gemini API responses."""
    with patch("gemini_api_handler.google.generativeai.GenerativeModel") as mock:
        mock_instance = mock.return_value
        mock_instance.generate_content.return_value.text = "Mock response"
        yield mock_instance
```