# Usage Examples

This page provides practical examples of how to use Sonne for various document analysis tasks.

## Web Interface Examples

### Analyzing a Research Paper

1. Upload your research paper PDF through the web interface
2. Select the "Research Analysis" template from the dropdown menu
3. Click "Process Document"
4. Review the generated summary, key findings, and citations

### Extracting Contract Information

1. Upload your contract PDF
2. Select the "Contract Analysis" template
3. Click "Process Document"
4. Review the parties involved, key dates, obligations, and terms highlighted in the analysis

### Analyzing Financial Reports

1. Upload your financial report PDF
2. Select the "Financial Analysis" template
3. Click "Process Document"
4. Review the key financial metrics, trends, and risk factors identified

## API Usage Examples

### Basic Document Upload and Analysis

```python
import requests

# API endpoint
url = "https://your-sonne-instance.com/api/analyze"

# Upload file and request analysis
files = {"document": open("example.pdf", "rb")}
data = {"analysis_type": "standard"}

response = requests.post(url, files=files, data=data)
results = response.json()

# Print analysis results
print(results["summary"])
print(results["entities"])
```

### Custom Analysis with Specific Questions

```python
import requests

# API endpoint
url = "https://your-sonne-instance.com/api/analyze"

# Upload file and request custom analysis
files = {"document": open("report.pdf", "rb")}
data = {
    "analysis_type": "custom",
    "questions": [
        "What is the main conclusion?",
        "What methodology was used?",
        "What are the key limitations mentioned?"
    ]
}

response = requests.post(url, files=files, data=data)
results = response.json()

# Process the answers to your questions
for question, answer in zip(data["questions"], results["answers"]):
    print(f"Q: {question}")
    print(f"A: {answer}")
    print()
```

### Batch Processing Multiple Documents

```python
import requests
import os

# API endpoint
url = "https://your-sonne-instance.com/api/batch"

# Prepare multiple files
files = []
for filename in os.listdir("documents"):
    if filename.endswith(".pdf"):
        files.append(("documents", open(f"documents/{filename}", "rb")))

# Request batch analysis
data = {"analysis_type": "standard"}
response = requests.post(url, files=files, data=data)
batch_id = response.json()["batch_id"]

# Check status and retrieve results when ready
status_url = f"https://your-sonne-instance.com/api/batch/{batch_id}"
status_response = requests.get(status_url)
results = status_response.json()

print(f"Processed {len(results['documents'])} documents")
```