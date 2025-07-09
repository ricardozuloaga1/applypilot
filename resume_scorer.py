import os
import re
import json
import logging
import numpy as np
from typing import Dict, List, Tuple, Optional, Any
from dataclasses import dataclass
from openai import OpenAI
import ollama

logger = logging.getLogger(__name__)


@dataclass
class ScoringResult:
    """Result object containing similarity score and suggestions"""
    original_score: float
    improved_score: float
    improved_resume: str
    suggestions: List[str]


class ResumeScorer:
    """
    Simplified resume scoring system that calculates cosine similarity
    between resume and job description using embeddings.
    """
    
    def __init__(self, 
                 openai_key: Optional[str] = None,
                 use_ollama: bool = False,
                 ollama_model: str = "gemma3:4b",
                 ollama_embedding_model: str = "nomic-embed-text:137m-v1.5-fp16",
                 max_retries: int = 3):
        """
        Initialize the resume scorer.
        
        Args:
            openai_key: OpenAI API key (if None, uses OPENAI_API_KEY env var)
            use_ollama: Whether to use Ollama instead of OpenAI
            ollama_model: Ollama model for text generation
            ollama_embedding_model: Ollama model for embeddings
            max_retries: Maximum retries for improvement attempts
        """
        self.use_ollama = use_ollama
        self.max_retries = max_retries
        
        if use_ollama:
            self.client = ollama.Client()
            self.model = ollama_model
            self.embedding_model = ollama_embedding_model
        else:
            api_key = openai_key or os.getenv("OPENAI_API_KEY")
            if not api_key:
                raise ValueError("OpenAI API key is required")
            self.client = OpenAI(api_key=api_key)
            self.model = "gpt-4o"
            self.embedding_model = "text-embedding-ada-002"
    
    def extract_keywords(self, text: str) -> List[str]:
        """
        Extract keywords from text using simple regex and common patterns.
        This replaces the complex LLM-based keyword extraction.
        """
        # Remove common stop words and extract meaningful terms
        stop_words = {
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 
            'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
            'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
            'should', 'may', 'might', 'must', 'shall', 'can', 'this', 'that',
            'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they'
        }
        
        # Extract words, keeping technical terms and acronyms
        words = re.findall(r'\b[A-Za-z][A-Za-z0-9+#\-\.]*\b', text.lower())
        
        # Filter out stop words and short words
        keywords = [word for word in words if word not in stop_words and len(word) > 2]
        
        # Count frequency and return top keywords
        word_freq = {}
        for word in keywords:
            word_freq[word] = word_freq.get(word, 0) + 1
        
        # Sort by frequency and return top 50
        sorted_words = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)
        return [word for word, freq in sorted_words[:50]]
    
    async def get_embedding(self, text: str) -> List[float]:
        """Get embedding for text using OpenAI or Ollama"""
        if self.use_ollama:
            try:
                response = self.client.embed(
                    input=text,
                    model=self.embedding_model
                )
                return response['embeddings'][0]
            except Exception as e:
                logger.error(f"Ollama embedding error: {e}")
                raise
        else:
            try:
                response = self.client.embeddings.create(
                    input=text,
                    model=self.embedding_model
                )
                return response.data[0].embedding
            except Exception as e:
                logger.error(f"OpenAI embedding error: {e}")
                raise
    
    def calculate_cosine_similarity(self, embedding1: List[float], embedding2: List[float]) -> float:
        """Calculate cosine similarity between two embeddings"""
        if not embedding1 or not embedding2:
            return 0.0
        
        vec1 = np.array(embedding1)
        vec2 = np.array(embedding2)
        
        # Calculate cosine similarity
        dot_product = np.dot(vec1, vec2)
        magnitude1 = np.linalg.norm(vec1)
        magnitude2 = np.linalg.norm(vec2)
        
        if magnitude1 == 0 or magnitude2 == 0:
            return 0.0
        
        return float(dot_product / (magnitude1 * magnitude2))
    
    async def improve_resume_with_llm(self, 
                                    resume_text: str,
                                    job_description: str,
                                    job_keywords: List[str],
                                    current_score: float,
                                    job_embedding: List[float]) -> Tuple[str, float]:
        """
        Use LLM to improve resume based on job description and keywords
        """
        prompt = f"""
You are an expert resume editor and talent acquisition specialist. Your task is to revise the following resume so that it aligns as closely as possible with the provided job description and extracted job keywords, in order to maximize the cosine similarity between the resume and the job keywords.

Instructions:
- Carefully review the job description and the list of extracted job keywords.
- Update the candidate's resume by:
  - Emphasizing and naturally incorporating relevant skills, experiences, and keywords from the job description and keyword list.
  - Where appropriate, naturally weave the extracted job keywords into the resume content.
  - Rewriting, adding, or removing resume content as needed to better match the job requirements.
  - Maintaining a natural, professional tone and avoiding keyword stuffing.
  - Where possible, use quantifiable achievements and action verbs.
  - The current cosine similarity score is {current_score:.4f}. Revise the resume to further increase this score.
- ONLY output the improved updated resume. Do not include any explanations, commentary, or formatting outside of the resume itself.

Job Description:
```
{job_description}
```

Extracted Job Keywords:
```
{', '.join(job_keywords)}
```

Original Resume:
```
{resume_text}
```

NOTE: ONLY OUTPUT THE IMPROVED UPDATED RESUME IN MARKDOWN FORMAT.
"""
        
        best_resume = resume_text
        best_score = current_score
        
        for attempt in range(self.max_retries):
            try:
                if self.use_ollama:
                    response = self.client.generate(
                        model=self.model,
                        prompt=prompt,
                        options={"temperature": 0.7, "top_p": 0.9}
                    )
                    improved_resume = response['response'].strip()
                else:
                    response = self.client.chat.completions.create(
                        model=self.model,
                        messages=[{"role": "user", "content": prompt}],
                        temperature=0.7,
                        max_tokens=4000
                    )
                    improved_resume = response.choices[0].message.content.strip()
                
                # Get embedding for improved resume
                improved_embedding = await self.get_embedding(improved_resume)
                
                # Calculate new score
                new_score = self.calculate_cosine_similarity(improved_embedding, job_embedding)
                
                if new_score > best_score:
                    best_resume = improved_resume
                    best_score = new_score
                    logger.info(f"Improved score from {current_score:.4f} to {new_score:.4f}")
                
            except Exception as e:
                logger.error(f"Error in improvement attempt {attempt + 1}: {e}")
                continue
        
        return best_resume, best_score
    
    def generate_suggestions(self, 
                           original_score: float, 
                           improved_score: float,
                           job_keywords: List[str]) -> List[str]:
        """Generate improvement suggestions based on keywords and scores"""
        suggestions = []
        
        if improved_score > original_score:
            suggestions.append(f"Resume improved from {original_score:.1%} to {improved_score:.1%} match")
        else:
            suggestions.append(f"Current resume match: {original_score:.1%}")
        
        # Add keyword-based suggestions
        suggestions.append(f"Key skills to highlight: {', '.join(job_keywords[:10])}")
        
        if improved_score < 0.7:
            suggestions.append("Consider adding more specific technical skills mentioned in the job description")
        
        if improved_score < 0.5:
            suggestions.append("Resume may need significant restructuring to match job requirements")
        
        return suggestions
    
    async def score_resume(self, resume_text: str, job_description: str) -> ScoringResult:
        """
        Main method to score resume against job description
        
        Args:
            resume_text: The resume content as string
            job_description: The job description as string
            
        Returns:
            ScoringResult with similarity score and improvement suggestions
        """
        try:
            # Extract keywords from job description
            job_keywords = self.extract_keywords(job_description)
            job_keywords_text = ', '.join(job_keywords)
            
            # Get embeddings
            resume_embedding = await self.get_embedding(resume_text)
            job_embedding = await self.get_embedding(job_keywords_text)
            
            # Calculate initial similarity score
            original_score = self.calculate_cosine_similarity(resume_embedding, job_embedding)
            
            # Improve resume using LLM
            improved_resume, improved_score = await self.improve_resume_with_llm(
                resume_text, job_description, job_keywords, original_score, job_embedding
            )
            
            # Generate suggestions
            suggestions = self.generate_suggestions(original_score, improved_score, job_keywords)
            
            return ScoringResult(
                original_score=original_score,
                improved_score=improved_score,
                improved_resume=improved_resume,
                suggestions=suggestions
            )
            
        except Exception as e:
            logger.error(f"Error scoring resume: {e}")
            raise


# Convenience function for simple usage
async def score_resume_simple(resume_text: str, 
                            job_description: str, 
                            openai_key: Optional[str] = None) -> Tuple[float, List[str]]:
    """
    Simple function to score resume and get suggestions
    
    Returns:
        Tuple of (similarity_score, suggestions_list)
    """
    scorer = ResumeScorer(openai_key=openai_key)
    result = await scorer.score_resume(resume_text, job_description)
    return result.improved_score, result.suggestions


# Example usage
if __name__ == "__main__":
    import asyncio
    
    async def main():
        # Example usage
        scorer = ResumeScorer(openai_key="your-openai-key")
        
        resume = """
        John Doe
        Software Engineer
        
        Experience:
        - Python developer with 3 years experience
        - Built web applications using Django
        - Worked with databases and APIs
        """
        
        job_desc = """
        Senior Python Developer
        
        Requirements:
        - 5+ years Python experience
        - Django framework expertise
        - REST API development
        - PostgreSQL database skills
        - AWS cloud experience
        """
        
        result = await scorer.score_resume(resume, job_desc)
        
        print(f"Original Score: {result.original_score:.1%}")
        print(f"Improved Score: {result.improved_score:.1%}")
        print(f"Suggestions: {result.suggestions}")
        print(f"Improved Resume:\n{result.improved_resume}")
    
    # asyncio.run(main())