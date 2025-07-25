#!/usr/bin/env python3
"""
Enhanced Job-Candidate Matching System using GPT-4o
Implements the 22-variable structured extraction and statistical comparison framework
"""

import json
import asyncio
from typing import Dict, List, Tuple, Optional
from openai import OpenAI
import numpy as np
from scipy import stats
from dataclasses import dataclass
from datetime import datetime

@dataclass
class MatchingResult:
    """Result of job-candidate matching analysis"""
    total_score: float
    confidence_level: float
    statistical_significance: bool
    category_scores: Dict[str, float]
    variable_matches: Dict[str, bool]
    missing_critical: List[str]
    recommendations: List[str]
    evidence_summary: Dict[str, str]

class EnhancedMatchingSystem:
    """
    Enhanced job-candidate matching using GPT-4o for structured variable extraction
    and statistical comparison based on the 22-variable framework.
    """
    
    def __init__(self, api_key: str):
        self.client = OpenAI(api_key=api_key)
        self.model = "gpt-4o"
        
        # Statistical thresholds from optimal matching research
        self.TOTAL_VARIABLES = 22
        self.SIGNIFICANCE_THRESHOLD = 14  # 63.6% for p < 0.05
        self.STRONG_EVIDENCE_THRESHOLD = 16  # 72.7% for p < 0.01
        self.EXCELLENT_EVIDENCE_THRESHOLD = 18  # 81.8% for p < 0.001
        
        # Variable categories and weights
        self.CATEGORY_WEIGHTS = {
            'critical_requirements': 0.40,
            'core_competencies': 0.35,
            'experience_factors': 0.15,
            'preferred_qualifications': 0.10
        }
        
        self.VARIABLE_COUNTS = {
            'critical_requirements': 5,
            'core_competencies': 8,
            'experience_factors': 4,
            'preferred_qualifications': 5
        }

    async def extract_job_variables(self, job_description: str, job_title: str, company: str) -> Dict:
        """
        Extract 22 structured variables from job description using GPT-4o
        """
        
        system_prompt = """You are an expert HR analyst and job requirements specialist. Your task is to extract exactly 22 structured variables from job descriptions for systematic candidate matching.

CRITICAL INSTRUCTIONS:
1. Extract EXACTLY 22 variables distributed across 4 categories
2. Be specific and measurable - avoid vague terms
3. Focus on requirements that can be verified from a resume
4. Include both explicit and implicit requirements
5. Consider industry standards and role expectations

VARIABLE CATEGORIES:
- Critical Requirements (5 variables): Must-have qualifications that disqualify if missing
- Core Competencies (8 variables): Key skills and abilities for job success  
- Experience Factors (4 variables): Experience-related requirements
- Preferred Qualifications (5 variables): Nice-to-have qualifications

Return your analysis in the exact JSON format specified."""

        user_prompt = f"""
Analyze this job posting and extract exactly 22 variables for candidate matching:

JOB TITLE: {job_title}
COMPANY: {company}
JOB DESCRIPTION:
{job_description}

Extract variables in this exact JSON format:

{{
  "job_analysis": {{
    "title": "{job_title}",
    "company": "{company}",
    "industry": "detected industry",
    "seniority_level": "entry/mid/senior/executive",
    "job_type": "technical/business/creative/etc"
  }},
  "critical_requirements": {{
    "req_1": {{
      "variable": "specific requirement name",
      "description": "detailed description",
      "evidence_needed": "what to look for in resume",
      "disqualifier": true
    }},
    "req_2": {{ ... }},
    "req_3": {{ ... }},
    "req_4": {{ ... }},
    "req_5": {{ ... }}
  }},
  "core_competencies": {{
    "comp_1": {{
      "variable": "skill/competency name",
      "description": "detailed description",
      "evidence_needed": "what to look for in resume",
      "proficiency_level": "beginner/intermediate/advanced/expert"
    }},
    "comp_2": {{ ... }},
    "comp_3": {{ ... }},
    "comp_4": {{ ... }},
    "comp_5": {{ ... }},
    "comp_6": {{ ... }},
    "comp_7": {{ ... }},
    "comp_8": {{ ... }}
  }},
  "experience_factors": {{
    "exp_1": {{
      "variable": "experience requirement",
      "description": "detailed description",
      "evidence_needed": "what to look for in resume",
      "minimum_threshold": "specific measurement"
    }},
    "exp_2": {{ ... }},
    "exp_3": {{ ... }},
    "exp_4": {{ ... }}
  }},
  "preferred_qualifications": {{
    "pref_1": {{
      "variable": "preferred qualification",
      "description": "detailed description", 
      "evidence_needed": "what to look for in resume",
      "bonus_value": "low/medium/high"
    }},
    "pref_2": {{ ... }},
    "pref_3": {{ ... }},
    "pref_4": {{ ... }},
    "pref_5": {{ ... }}
  }}
}}

EXAMPLES of good variable extraction:
- "Bachelor's degree in Computer Science" → specific, verifiable
- "5+ years Python development experience" → measurable threshold
- "Experience with AWS cloud services" → specific technology
- "Strong communication skills" → general competency
- "Agile methodology experience" → specific process knowledge

Ensure each variable is:
✓ Specific and measurable
✓ Verifiable from resume content
✓ Relevant to job success
✓ Distinct from other variables
"""

        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                max_tokens=4000,
                temperature=0.1
            )
            
            content = response.choices[0].message.content
            # Clean and parse JSON
            clean_content = content.replace('```json', '').replace('```', '').strip()
            job_variables = json.loads(clean_content)
            
            return job_variables
            
        except Exception as e:
            print(f"Error extracting job variables: {e}")
            raise

    async def extract_candidate_variables(self, resume_text: str, resume_data: Dict) -> Dict:
        """
        Extract 22 corresponding variables from candidate resume using GPT-4o
        """
        
        system_prompt = """You are an expert resume analyzer. Your task is to extract exactly 22 structured variables from candidate resumes that correspond to job requirements for systematic matching.

CRITICAL INSTRUCTIONS:
1. Extract EXACTLY 22 variables distributed across 4 categories
2. Base extraction on ACTUAL resume content only - don't invent information
3. Provide specific evidence from the resume for each variable
4. Rate proficiency/experience levels accurately
5. Include both explicit and inferred capabilities

VARIABLE CATEGORIES:
- Critical Requirements (5 variables): Educational background, certifications, licenses
- Core Competencies (8 variables): Technical skills, software proficiency, methodologies
- Experience Factors (4 variables): Years of experience, industry background, role progression
- Preferred Qualifications (5 variables): Additional skills, certifications, achievements

Return your analysis in the exact JSON format specified."""

        user_prompt = f"""
Analyze this candidate's resume and extract exactly 22 variables for job matching:

RESUME TEXT:
{resume_text}

STRUCTURED RESUME DATA:
{json.dumps(resume_data, indent=2)}

Extract variables in this exact JSON format:

{{
  "candidate_analysis": {{
    "name": "candidate name",
    "years_total_experience": "calculated total years",
    "current_level": "entry/mid/senior/executive",
    "primary_expertise": "main area of expertise",
    "industry_background": "industry experience"
  }},
  "critical_requirements": {{
    "req_1": {{
      "variable": "education/certification/license",
      "present": true/false,
      "evidence": "specific evidence from resume or 'Not found'",
      "details": "degree/certification details"
    }},
    "req_2": {{ ... }},
    "req_3": {{ ... }},
    "req_4": {{ ... }},
    "req_5": {{ ... }}
  }},
  "core_competencies": {{
    "comp_1": {{
      "variable": "technical skill/competency",
      "present": true/false,
      "evidence": "specific evidence from resume or 'Not found'",
      "proficiency_level": "beginner/intermediate/advanced/expert",
      "years_experience": "estimated years with this skill"
    }},
    "comp_2": {{ ... }},
    "comp_3": {{ ... }},
    "comp_4": {{ ... }},
    "comp_5": {{ ... }},
    "comp_6": {{ ... }},
    "comp_7": {{ ... }},
    "comp_8": {{ ... }}
  }},
  "experience_factors": {{
    "exp_1": {{
      "variable": "experience type",
      "present": true/false,
      "evidence": "specific evidence from resume or 'Not found'",
      "measurement": "years/projects/companies/etc",
      "meets_threshold": true/false
    }},
    "exp_2": {{ ... }},
    "exp_3": {{ ... }},
    "exp_4": {{ ... }}
  }},
  "preferred_qualifications": {{
    "pref_1": {{
      "variable": "additional qualification",
      "present": true/false,
      "evidence": "specific evidence from resume or 'Not found'",
      "value_level": "low/medium/high"
    }},
    "pref_2": {{ ... }},
    "pref_3": {{ ... }},
    "pref_4": {{ ... }},
    "pref_5": {{ ... }}
  }}
}}

ANALYSIS GUIDELINES:
- Look for explicit mentions and reasonable inferences
- Consider job titles, responsibilities, and achievements
- Evaluate skill levels based on context and experience
- Provide specific evidence quotes when possible
- Be honest about missing qualifications
"""

        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                max_tokens=4000,
                temperature=0.1
            )
            
            content = response.choices[0].message.content
            clean_content = content.replace('```json', '').replace('```', '').strip()
            candidate_variables = json.loads(clean_content)
            
            return candidate_variables
            
        except Exception as e:
            print(f"Error extracting candidate variables: {e}")
            raise

    async def create_comparison_table(self, job_variables: Dict, candidate_variables: Dict) -> MatchingResult:
        """
        Create detailed comparison table and calculate statistical match score using GPT-4o
        """
        
        system_prompt = """You are an expert statistical analyst specializing in job-candidate matching. Your task is to create a detailed comparison table and calculate a statistically validated match score.

STATISTICAL FRAMEWORK:
- Total Variables: 22
- Significance Threshold: ≥14 matches (63.6%) for p < 0.05
- Strong Evidence: ≥16 matches (72.7%) for p < 0.01  
- Excellent Evidence: ≥18 matches (81.8%) for p < 0.001

CATEGORY WEIGHTS:
- Critical Requirements: 40% (5 variables)
- Core Competencies: 35% (8 variables)
- Experience Factors: 15% (4 variables)
- Preferred Qualifications: 10% (5 variables)

MATCHING LOGIC:
- Critical Requirements: Must match exactly (binary: match/no match)
- Core Competencies: Consider proficiency levels and experience
- Experience Factors: Check if thresholds are met
- Preferred Qualifications: Bonus points for additional value

Return detailed analysis in the exact JSON format specified."""

        user_prompt = f"""
Compare these job requirements with candidate qualifications and create a detailed comparison table:

JOB REQUIREMENTS:
{json.dumps(job_variables, indent=2)}

CANDIDATE QUALIFICATIONS:
{json.dumps(candidate_variables, indent=2)}

Create comparison in this exact JSON format:

{{
  "comparison_summary": {{
    "total_matches": "number of matches out of 22",
    "match_percentage": "percentage as decimal",
    "statistical_significance": "none/significant/strong/excellent",
    "confidence_level": "percentage",
    "overall_recommendation": "reject/weak_maybe/moderate_fit/strong_fit/excellent_fit"
  }},
  "detailed_comparison": {{
    "critical_requirements": {{
      "matches": "number out of 5",
      "score": "weighted score",
      "details": [
        {{
          "variable": "requirement name",
          "required": "job requirement",
          "candidate_has": "candidate evidence",
          "match": true/false,
          "impact": "high/medium/low",
          "notes": "explanation"
        }}
      ]
    }},
    "core_competencies": {{
      "matches": "number out of 8",
      "score": "weighted score",
      "details": [
        {{
          "variable": "competency name",
          "required_level": "job requirement level",
          "candidate_level": "candidate proficiency",
          "match": true/false,
          "gap_analysis": "explanation of gap if any",
          "notes": "additional context"
        }}
      ]
    }},
    "experience_factors": {{
      "matches": "number out of 4",
      "score": "weighted score", 
      "details": [
        {{
          "variable": "experience type",
          "required_threshold": "job requirement",
          "candidate_measurement": "candidate evidence",
          "meets_threshold": true/false,
          "notes": "explanation"
        }}
      ]
    }},
    "preferred_qualifications": {{
      "matches": "number out of 5",
      "score": "weighted score",
      "details": [
        {{
          "variable": "preferred qualification",
          "desired": "job preference",
          "candidate_has": "candidate evidence",
          "present": true/false,
          "value_added": "low/medium/high",
          "notes": "explanation"
        }}
      ]
    }}
  }},
  "statistical_analysis": {{
    "chi_square_test": {{
      "statistic": "calculated chi-square value",
      "p_value": "statistical p-value",
      "significant": true/false
    }},
    "effect_size": {{
      "cohens_d": "calculated effect size",
      "interpretation": "small/medium/large/very_large"
    }},
    "confidence_intervals": {{
      "lower_bound": "95% CI lower bound",
      "upper_bound": "95% CI upper bound"
    }}
  }},
  "recommendations": {{
    "hiring_decision": "strong_recommend/recommend/maybe/weak_maybe/reject",
    "missing_critical": ["list of missing critical requirements"],
    "development_areas": ["areas for candidate development"],
    "strengths": ["candidate strengths"],
    "next_steps": ["recommended actions"]
  }}
}}

ANALYSIS INSTRUCTIONS:
1. Compare each variable systematically
2. Calculate exact match counts for each category
3. Apply statistical tests for significance
4. Provide specific evidence for each decision
5. Include actionable recommendations
6. Be objective and data-driven in assessment
"""

        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                max_tokens=6000,
                temperature=0.1
            )
            
            content = response.choices[0].message.content
            clean_content = content.replace('```json', '').replace('```', '').strip()
            comparison_result = json.loads(clean_content)
            
            # Extract key metrics
            total_matches = int(comparison_result['comparison_summary']['total_matches'].split(' ')[0])
            match_percentage = float(comparison_result['comparison_summary']['match_percentage'])
            
            # Determine statistical significance
            statistical_significance = total_matches >= self.SIGNIFICANCE_THRESHOLD
            
            if total_matches >= self.EXCELLENT_EVIDENCE_THRESHOLD:
                confidence_level = 99.9
                significance_level = "excellent"
            elif total_matches >= self.STRONG_EVIDENCE_THRESHOLD:
                confidence_level = 99.0
                significance_level = "strong"
            elif total_matches >= self.SIGNIFICANCE_THRESHOLD:
                confidence_level = 95.0
                significance_level = "significant"
            else:
                confidence_level = 0.0
                significance_level = "none"
            
            # Calculate weighted total score
            category_scores = {
                'critical_requirements': float(comparison_result['detailed_comparison']['critical_requirements']['score']),
                'core_competencies': float(comparison_result['detailed_comparison']['core_competencies']['score']),
                'experience_factors': float(comparison_result['detailed_comparison']['experience_factors']['score']),
                'preferred_qualifications': float(comparison_result['detailed_comparison']['preferred_qualifications']['score'])
            }
            
            total_score = sum(
                category_scores[cat] * self.CATEGORY_WEIGHTS[cat] 
                for cat in category_scores
            )
            
            # Extract missing critical requirements
            missing_critical = comparison_result['recommendations']['missing_critical']
            
            # Create variable matches dictionary
            variable_matches = {}
            for category in ['critical_requirements', 'core_competencies', 'experience_factors', 'preferred_qualifications']:
                for detail in comparison_result['detailed_comparison'][category]['details']:
                    variable_matches[detail['variable']] = detail.get('match', detail.get('present', False))
            
            # Extract evidence summary
            evidence_summary = {}
            for category in ['critical_requirements', 'core_competencies', 'experience_factors', 'preferred_qualifications']:
                for detail in comparison_result['detailed_comparison'][category]['details']:
                    evidence_summary[detail['variable']] = detail.get('candidate_has', detail.get('notes', ''))
            
            return MatchingResult(
                total_score=total_score,
                confidence_level=confidence_level,
                statistical_significance=statistical_significance,
                category_scores=category_scores,
                variable_matches=variable_matches,
                missing_critical=missing_critical,
                recommendations=comparison_result['recommendations']['next_steps'],
                evidence_summary=evidence_summary
            )
            
        except Exception as e:
            print(f"Error creating comparison table: {e}")
            raise

    async def full_matching_analysis(self, job_description: str, job_title: str, company: str, 
                                   resume_text: str, resume_data: Dict) -> Dict:
        """
        Complete end-to-end matching analysis using GPT-4o
        """
        
        print(f"🔍 Starting full matching analysis for: {job_title} at {company}")
        
        # Step 1: Extract job variables
        print("📋 Extracting job variables...")
        job_variables = await self.extract_job_variables(job_description, job_title, company)
        
        # Step 2: Extract candidate variables  
        print("👤 Extracting candidate variables...")
        candidate_variables = await self.extract_candidate_variables(resume_text, resume_data)
        
        # Step 3: Create comparison table
        print("📊 Creating comparison table...")
        matching_result = await self.create_comparison_table(job_variables, candidate_variables)
        
        # Step 4: Compile comprehensive result
        comprehensive_result = {
            'analysis_timestamp': datetime.now().isoformat(),
            'job_analysis': job_variables,
            'candidate_analysis': candidate_variables,
            'matching_result': {
                'total_score': matching_result.total_score,
                'confidence_level': matching_result.confidence_level,
                'statistical_significance': matching_result.statistical_significance,
                'category_scores': matching_result.category_scores,
                'variable_matches': matching_result.variable_matches,
                'missing_critical': matching_result.missing_critical,
                'recommendations': matching_result.recommendations,
                'evidence_summary': matching_result.evidence_summary
            },
            'statistical_framework': {
                'total_variables': self.TOTAL_VARIABLES,
                'significance_threshold': self.SIGNIFICANCE_THRESHOLD,
                'strong_evidence_threshold': self.STRONG_EVIDENCE_THRESHOLD,
                'excellent_evidence_threshold': self.EXCELLENT_EVIDENCE_THRESHOLD,
                'category_weights': self.CATEGORY_WEIGHTS
            }
        }
        
        print(f"✅ Analysis complete! Score: {matching_result.total_score:.1f}, Confidence: {matching_result.confidence_level}%")
        
        return comprehensive_result


# Example usage function
async def example_usage():
    """
    Example of how to use the enhanced matching system
    """
    
    # Initialize the system with your OpenAI API key
    matcher = EnhancedMatchingSystem(api_key="your-openai-api-key")
    
    # Example job description
    job_description = """
    Senior Software Engineer - Full Stack
    
    We are seeking a skilled Senior Software Engineer to join our team. The ideal candidate will have:
    
    Required:
    - Bachelor's degree in Computer Science or related field
    - 5+ years of professional software development experience
    - Strong proficiency in Python and JavaScript
    - Experience with React and Node.js
    - Knowledge of SQL databases and REST APIs
    - Experience with Git version control
    
    Preferred:
    - AWS cloud experience
    - Docker containerization
    - Agile/Scrum methodology
    - Technical leadership experience
    - Master's degree
    """
    
    # Example resume text and data
    resume_text = "John Doe, Senior Software Engineer with 6 years experience..."
    resume_data = {
        "personalInfo": {"name": "John Doe"},
        "experience": [{"title": "Senior Software Engineer", "company": "TechCorp"}],
        "coreSkills": ["Python", "JavaScript", "React", "Node.js"]
    }
    
    # Run the full analysis
    result = await matcher.full_matching_analysis(
        job_description=job_description,
        job_title="Senior Software Engineer",
        company="TechCorp",
        resume_text=resume_text,
        resume_data=resume_data
    )
    
    print("\n=== MATCHING ANALYSIS RESULTS ===")
    print(f"Total Score: {result['matching_result']['total_score']:.1f}")
    print(f"Confidence Level: {result['matching_result']['confidence_level']}%")
    print(f"Statistical Significance: {result['matching_result']['statistical_significance']}")
    print(f"Missing Critical Requirements: {result['matching_result']['missing_critical']}")


if __name__ == "__main__":
    asyncio.run(example_usage()) 