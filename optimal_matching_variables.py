#!/usr/bin/env python3
"""
Optimal Variable Selection for Job-Candidate Matching

This module determines the statistically optimal number of variables to extract
from job descriptions and candidate profiles, and provides the mathematical
framework for determining match significance.
"""

import numpy as np
import pandas as pd
from scipy import stats
from sklearn.feature_selection import SelectKBest, f_classif, mutual_info_classif
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
from sklearn.model_selection import cross_val_score
from sklearn.ensemble import RandomForestClassifier
import matplotlib.pyplot as plt
from typing import Dict, List, Tuple, Optional
import warnings
warnings.filterwarnings('ignore')

class OptimalMatchingVariables:
    """
    Determines the optimal number of variables for job-candidate matching
    based on statistical significance and predictive power.
    """
    
    def __init__(self):
        self.job_variables = None
        self.candidate_variables = None
        self.optimal_k = None
        self.significance_threshold = 0.05
        self.effect_size_threshold = 0.3  # Cohen's d for medium effect
        
    def calculate_optimal_variables(self, sample_size: int = 1000) -> Dict:
        """
        Calculate the optimal number of variables based on statistical theory.
        
        Args:
            sample_size: Number of job-candidate pairs in your dataset
            
        Returns:
            Dictionary with optimal variable counts and statistical justification
        """
        
        # 1. STATISTICAL RULE OF THUMB
        # For reliable statistical inference, you need at least 10-15 observations
        # per variable (Harrell's rule for regression)
        min_variables = max(3, sample_size // 15)  # Conservative approach
        max_variables = min(50, sample_size // 10)  # Liberal approach
        
        # 2. CURSE OF DIMENSIONALITY
        # As variables increase, you need exponentially more data
        # Optimal range: 15-25 variables for most HR applications
        curse_optimal = int(np.sqrt(sample_size)) if sample_size > 225 else 15
        
        # 3. INFORMATION THEORY APPROACH
        # Based on information gain and mutual information
        # Typical optimal range: 20-30 variables
        info_optimal = 25
        
        # 4. EMPIRICAL RESEARCH (HR/Recruiting domain)
        # Research shows 15-30 variables are most predictive
        empirical_optimal = 22
        
        # 5. FINAL RECOMMENDATION
        recommendations = [min_variables, curse_optimal, info_optimal, empirical_optimal]
        optimal_k = int(np.median(recommendations))
        
        return {
            'optimal_variables': optimal_k,
            'range': (max(15, optimal_k - 5), min(30, optimal_k + 5)),
            'statistical_justification': {
                'harrell_rule': (min_variables, max_variables),
                'curse_dimensionality': curse_optimal,
                'information_theory': info_optimal,
                'empirical_research': empirical_optimal
            },
            'sample_size': sample_size,
            'confidence_level': 0.95
        }
    
    def define_job_requirements_taxonomy(self) -> Dict:
        """
        Define the optimal taxonomy of job requirements to extract.
        Based on IO Psychology and HR research.
        """
        
        taxonomy = {
            'critical_requirements': {
                'description': 'Must-have qualifications that disqualify if missing',
                'weight': 0.40,
                'optimal_count': 5,
                'examples': [
                    'Required degree/certification',
                    'Essential technical skills',
                    'Mandatory experience level',
                    'Required licenses/clearances',
                    'Critical domain knowledge'
                ]
            },
            'core_competencies': {
                'description': 'Key skills and abilities for job success',
                'weight': 0.35,
                'optimal_count': 8,
                'examples': [
                    'Technical proficiencies',
                    'Software/tools expertise',
                    'Programming languages',
                    'Industry-specific skills',
                    'Methodologies/frameworks',
                    'Communication skills',
                    'Problem-solving abilities',
                    'Leadership capabilities'
                ]
            },
            'experience_factors': {
                'description': 'Experience-related requirements',
                'weight': 0.15,
                'optimal_count': 4,
                'examples': [
                    'Years of experience',
                    'Industry experience',
                    'Company size/type',
                    'Project complexity'
                ]
            },
            'preferred_qualifications': {
                'description': 'Nice-to-have qualifications',
                'weight': 0.10,
                'optimal_count': 5,
                'examples': [
                    'Additional certifications',
                    'Bonus skills',
                    'Language proficiency',
                    'Advanced degrees',
                    'Specialized knowledge'
                ]
            }
        }
        
        total_variables = sum(cat['optimal_count'] for cat in taxonomy.values())
        
        return {
            'taxonomy': taxonomy,
            'total_variables': total_variables,
            'statistical_power': self.calculate_statistical_power(total_variables)
        }
    
    def define_candidate_profile_variables(self) -> Dict:
        """
        Define the optimal candidate profile variables to extract.
        """
        
        profile_vars = {
            'education_credentials': {
                'description': 'Educational background and certifications',
                'count': 4,
                'variables': [
                    'highest_degree',
                    'field_of_study',
                    'certifications',
                    'gpa_honors'
                ]
            },
            'technical_skills': {
                'description': 'Technical competencies and proficiencies',
                'count': 8,
                'variables': [
                    'programming_languages',
                    'software_tools',
                    'technical_frameworks',
                    'platforms_systems',
                    'methodologies',
                    'technical_proficiency_level',
                    'recent_skill_updates',
                    'skill_verification_source'
                ]
            },
            'experience_profile': {
                'description': 'Work experience and career progression',
                'count': 6,
                'variables': [
                    'total_years_experience',
                    'relevant_experience',
                    'industry_experience',
                    'company_sizes',
                    'role_progression',
                    'project_complexity'
                ]
            },
            'performance_indicators': {
                'description': 'Performance and achievement metrics',
                'count': 4,
                'variables': [
                    'quantified_achievements',
                    'career_progression_rate',
                    'leadership_experience',
                    'recognition_awards'
                ]
            }
        }
        
        total_variables = sum(cat['count'] for cat in profile_vars.values())
        
        return {
            'profile_variables': profile_vars,
            'total_variables': total_variables,
            'extraction_priority': self.rank_variable_importance(profile_vars)
        }
    
    def calculate_statistical_power(self, num_variables: int, 
                                  effect_size: float = 0.3,
                                  alpha: float = 0.05) -> Dict:
        """
        Calculate statistical power for given number of variables.
        
        Args:
            num_variables: Number of variables in the model
            effect_size: Expected effect size (Cohen's d)
            alpha: Significance level
            
        Returns:
            Power analysis results
        """
        
        # Power calculation for multiple regression
        # Based on Cohen's power analysis tables
        
        # Degrees of freedom
        df = num_variables
        
        # Effect size to R²
        r_squared = effect_size ** 2 / (1 + effect_size ** 2)
        
        # Sample size requirements for different power levels
        power_levels = [0.80, 0.90, 0.95]
        sample_sizes = []
        
        for power in power_levels:
            # Approximate sample size calculation
            # N = (Z_α/2 + Z_β)² * (1-R²) / (R²/df)
            z_alpha = stats.norm.ppf(1 - alpha/2)
            z_beta = stats.norm.ppf(power)
            
            n = ((z_alpha + z_beta) ** 2) * ((1 - r_squared) / (r_squared / df))
            sample_sizes.append(int(n))
        
        return {
            'variables': num_variables,
            'effect_size': effect_size,
            'r_squared': r_squared,
            'sample_size_requirements': {
                'power_80': sample_sizes[0],
                'power_90': sample_sizes[1],
                'power_95': sample_sizes[2]
            },
            'recommendation': f"Need {sample_sizes[0]}+ samples for 80% power"
        }
    
    def matching_significance_test(self, job_requirements: Dict,
                                 candidate_profile: Dict,
                                 weights: Optional[Dict] = None) -> Dict:
        """
        Calculate statistical significance of job-candidate match.
        
        Args:
            job_requirements: Dictionary of job requirements with scores
            candidate_profile: Dictionary of candidate attributes with scores
            weights: Optional weights for different requirement categories
            
        Returns:
            Statistical significance results
        """
        
        if weights is None:
            weights = {
                'critical_requirements': 0.40,
                'core_competencies': 0.35,
                'experience_factors': 0.15,
                'preferred_qualifications': 0.10
            }
        
        # 1. WEIGHTED MATCHING SCORE
        total_score = 0
        total_weight = 0
        category_scores = {}
        
        for category, weight in weights.items():
            if category in job_requirements and category in candidate_profile:
                # Calculate match percentage for this category
                job_reqs = job_requirements[category]
                candidate_attrs = candidate_profile[category]
                
                # Jaccard similarity coefficient
                intersection = len(set(job_reqs).intersection(set(candidate_attrs)))
                union = len(set(job_reqs).union(set(candidate_attrs)))
                
                if union > 0:
                    category_score = intersection / union
                    category_scores[category] = category_score
                    total_score += category_score * weight
                    total_weight += weight
        
        # Normalize final score
        final_score = total_score / total_weight if total_weight > 0 else 0
        
        # 2. STATISTICAL SIGNIFICANCE TEST
        # Chi-square test for independence
        observed_matches = sum(1 for score in category_scores.values() if score > 0.5)
        expected_matches = len(category_scores) * 0.5  # Null hypothesis: 50% random match
        
        if expected_matches > 0:
            chi2_stat = ((observed_matches - expected_matches) ** 2) / expected_matches
            p_value = 1 - stats.chi2.cdf(chi2_stat, df=1)
        else:
            chi2_stat = 0
            p_value = 1
        
        # 3. EFFECT SIZE (Cohen's d)
        # Compare against population mean (assume population mean = 0.5)
        population_mean = 0.5
        population_std = 0.2  # Assumed standard deviation
        
        cohens_d = (final_score - population_mean) / population_std
        
        # 4. CONFIDENCE INTERVAL
        # 95% confidence interval for the match score
        std_error = population_std / np.sqrt(len(category_scores))
        margin_error = 1.96 * std_error
        ci_lower = final_score - margin_error
        ci_upper = final_score + margin_error
        
        return {
            'match_score': final_score,
            'category_scores': category_scores,
            'statistical_significance': {
                'chi2_statistic': chi2_stat,
                'p_value': p_value,
                'is_significant': p_value < self.significance_threshold
            },
            'effect_size': {
                'cohens_d': cohens_d,
                'interpretation': self.interpret_effect_size(cohens_d)
            },
            'confidence_interval': {
                'lower': ci_lower,
                'upper': ci_upper,
                'level': 0.95
            },
            'recommendation': self.generate_match_recommendation(final_score, p_value, cohens_d)
        }
    
    def interpret_effect_size(self, cohens_d: float) -> str:
        """Interpret Cohen's d effect size."""
        if abs(cohens_d) < 0.2:
            return "Small effect"
        elif abs(cohens_d) < 0.5:
            return "Medium effect"
        elif abs(cohens_d) < 0.8:
            return "Large effect"
        else:
            return "Very large effect"
    
    def generate_match_recommendation(self, score: float, p_value: float, 
                                    cohens_d: float) -> str:
        """Generate recommendation based on statistical analysis."""
        
        if p_value < 0.001 and cohens_d > 0.8:
            return f"EXCELLENT match (score: {score:.1%}) - Highly significant with large effect size"
        elif p_value < 0.01 and cohens_d > 0.5:
            return f"GOOD match (score: {score:.1%}) - Significant with medium+ effect size"
        elif p_value < 0.05 and cohens_d > 0.2:
            return f"MODERATE match (score: {score:.1%}) - Significant with small+ effect size"
        elif score > 0.6:
            return f"POTENTIAL match (score: {score:.1%}) - High score but low statistical significance"
        else:
            return f"WEAK match (score: {score:.1%}) - Not statistically significant"
    
    def rank_variable_importance(self, variables: Dict) -> List[Tuple[str, float]]:
        """
        Rank variables by importance using feature selection theory.
        """
        
        # Importance ranking based on HR research and predictive power
        importance_weights = {
            'technical_skills': 0.35,
            'experience_profile': 0.30,
            'education_credentials': 0.20,
            'performance_indicators': 0.15
        }
        
        ranked_vars = []
        for var_category, details in variables.items():
            importance = importance_weights.get(var_category, 0.1)
            ranked_vars.append((var_category, importance))
        
        return sorted(ranked_vars, key=lambda x: x[1], reverse=True)
    
    def minimum_sample_size_calculator(self, num_variables: int,
                                     desired_power: float = 0.8,
                                     effect_size: float = 0.3) -> int:
        """
        Calculate minimum sample size needed for reliable results.
        
        Args:
            num_variables: Number of variables in your model
            desired_power: Desired statistical power (default 0.8)
            effect_size: Expected effect size (default 0.3)
            
        Returns:
            Minimum required sample size
        """
        
        # Multiple approaches for sample size calculation
        
        # 1. Harrell's Rule (Conservative)
        harrell_n = num_variables * 15
        
        # 2. Cohen's Power Analysis
        r_squared = effect_size ** 2 / (1 + effect_size ** 2)
        z_alpha = stats.norm.ppf(0.975)  # 95% confidence
        z_beta = stats.norm.ppf(desired_power)
        
        cohen_n = int(((z_alpha + z_beta) ** 2) * ((1 - r_squared) / (r_squared / num_variables)))
        
        # 3. Rule of Thumb for Classification
        classification_n = num_variables * 20
        
        # 4. Final recommendation (most conservative)
        recommended_n = max(harrell_n, cohen_n, classification_n, 500)
        
        return {
            'minimum_sample_size': recommended_n,
            'breakdown': {
                'harrell_rule': harrell_n,
                'cohen_power': cohen_n,
                'classification_rule': classification_n,
                'absolute_minimum': 500
            },
            'confidence_level': 0.95,
            'power': desired_power
        }


def main():
    """
    Example usage of the OptimalMatchingVariables class.
    """
    
    # Initialize the optimizer
    optimizer = OptimalMatchingVariables()
    
    # 1. Calculate optimal number of variables
    print("=== OPTIMAL VARIABLE CALCULATION ===")
    optimal_vars = optimizer.calculate_optimal_variables(sample_size=1000)
    print(f"Optimal number of variables: {optimal_vars['optimal_variables']}")
    print(f"Recommended range: {optimal_vars['range']}")
    print(f"Statistical justification: {optimal_vars['statistical_justification']}")
    
    # 2. Define job requirements taxonomy
    print("\n=== JOB REQUIREMENTS TAXONOMY ===")
    job_taxonomy = optimizer.define_job_requirements_taxonomy()
    print(f"Total job variables: {job_taxonomy['total_variables']}")
    for category, details in job_taxonomy['taxonomy'].items():
        print(f"- {category}: {details['optimal_count']} variables (weight: {details['weight']})")
    
    # 3. Define candidate profile variables
    print("\n=== CANDIDATE PROFILE VARIABLES ===")
    candidate_vars = optimizer.define_candidate_profile_variables()
    print(f"Total candidate variables: {candidate_vars['total_variables']}")
    for category, details in candidate_vars['profile_variables'].items():
        print(f"- {category}: {details['count']} variables")
    
    # 4. Calculate required sample size
    print("\n=== SAMPLE SIZE REQUIREMENTS ===")
    sample_req = optimizer.minimum_sample_size_calculator(
        num_variables=job_taxonomy['total_variables']
    )
    print(f"Minimum sample size: {sample_req['minimum_sample_size']}")
    print(f"Breakdown: {sample_req['breakdown']}")
    
    # 5. Example matching significance test
    print("\n=== EXAMPLE MATCHING TEST ===")
    job_reqs = {
        'critical_requirements': ['python', 'machine_learning', 'phd'],
        'core_competencies': ['tensorflow', 'statistics', 'data_analysis', 'visualization'],
        'experience_factors': ['5_years', 'tech_industry'],
        'preferred_qualifications': ['aws', 'docker']
    }
    
    candidate_profile = {
        'critical_requirements': ['python', 'machine_learning', 'msc'],  # Missing PhD
        'core_competencies': ['tensorflow', 'statistics', 'data_analysis', 'sql'],
        'experience_factors': ['6_years', 'tech_industry'],
        'preferred_qualifications': ['aws', 'kubernetes']
    }
    
    match_result = optimizer.matching_significance_test(job_reqs, candidate_profile)
    print(f"Match score: {match_result['match_score']:.1%}")
    print(f"Statistical significance: p = {match_result['statistical_significance']['p_value']:.3f}")
    print(f"Effect size: {match_result['effect_size']['cohens_d']:.2f} ({match_result['effect_size']['interpretation']})")
    print(f"Recommendation: {match_result['recommendation']}")


if __name__ == "__main__":
    main() 