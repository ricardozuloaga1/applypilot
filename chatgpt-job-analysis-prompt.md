# Job Description Analysis & Variable Extraction System

## Part 1: General/Fixed Requirements Analysis

You are an expert HR analyst with extensive experience across multiple industries. Your task is to analyze job descriptions and identify the **general/fixed requirements** that commonly appear across most job postings.

**Task 1: Identify Universal Job Requirements**

Please analyze typical job descriptions and identify the **20-30 most common requirements** that appear across industries. Categorize them into these weighted categories:

### CRITICAL_REQUIREMENTS (40% weight)
- Requirements that are absolutely essential and commonly mentioned
- Examples: Education level, certifications, years of experience, etc.

### CORE_COMPETENCIES (35% weight)
- Skills and abilities that are frequently required
- Examples: Communication skills, problem-solving, leadership, etc.

### EXPERIENCE_FACTORS (15% weight)
- Experience-related requirements that commonly appear
- Examples: Management experience, industry experience, etc.

### PREFERRED_QUALIFICATIONS (10% weight)
- Nice-to-have qualifications that frequently appear
- Examples: Additional certifications, language skills, etc.

**Output Format:**
```json
{
  "universal_variables": [
    {
      "name": "Bachelor's Degree Requirement",
      "category": "CRITICAL_REQUIREMENTS",
      "frequency": "85%",
      "description": "Educational requirement commonly specified",
      "common_phrases": ["Bachelor's degree", "BA/BS required", "University degree"]
    }
  ]
}
```

---

## Part 2: Dynamic Catch-All System Prompt

After identifying the universal variables, create a **comprehensive prompt** that can be used to extract **job-specific requirements** that are NOT covered by the universal variables.

**Task 2: Generate a Catch-All Extraction Prompt**

Create a prompt that:
1. Takes a job description as input
2. Identifies job-specific requirements that aren't covered by universal variables
3. Extracts unique industry-specific, company-specific, or role-specific requirements
4. Ensures no duplication with universal variables
5. Maintains evidence-based extraction (only what's explicitly mentioned)

**Requirements for the Catch-All Prompt:**
- Must avoid extracting anything already covered by universal variables
- Must focus on unique, job-specific requirements
- Must maintain evidence-based approach (no generic industry standards)
- Must categorize findings into the same 4 categories with weights
- Must provide evidence from job posting for each extracted variable

**The prompt should be structured as:**
```
You are an expert job analyst. You have access to a set of universal job variables that cover common requirements. Your task is to extract ONLY the job-specific requirements that are NOT covered by these universal variables.

[Universal Variables List]
[Extraction Instructions]
[Evidence Requirements]
[Output Format]
```

---

## Part 3: Implementation Strategy

Finally, explain how this two-part system would work in practice:

1. **Universal Variables**: Applied to every job analysis (consistent baseline)
2. **Dynamic Variables**: Extracted per job posting (job-specific additions)
3. **Combination Logic**: How to merge both sets without duplication
4. **Scoring System**: How to weight universal vs dynamic variables
5. **Quality Control**: How to ensure accuracy and avoid redundancy

**Expected Benefits:**
- Faster analysis (universal variables pre-defined)
- Comprehensive coverage (dynamic variables catch unique requirements)
- No duplication (clear separation of concerns)
- Consistent baseline (universal variables provide structure)
- Job-specific accuracy (dynamic variables capture uniqueness)

Please provide a detailed analysis and the requested catch-all prompt that can be implemented immediately. 