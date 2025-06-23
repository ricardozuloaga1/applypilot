#!/usr/bin/env node

const axios = require('axios');

const API_KEY = 'gAAAAABoWV_5NvZEI-ef2fGrSjIEEMk3rTGryYsv29XMFE55BRMnSUGlhfgAAVQkLU4UPcaTm-Lwf2POlHHpdQVmS7j7jR3kWQ==';
const JOB_AGE_IN_DAYS = 30;

function parseArgs() {
  const args = process.argv.slice(2);
  if (args.includes('--help')) {
    console.log('Usage: node test-mantiks-api.js [job_title] [location]');
    console.log('Example: node test-mantiks-api.js "Data Scientist" "San Francisco"');
    process.exit(0);
  }
  const jobTitle = args[0] || 'Software Engineer';
  const location = args[1] || 'New York';
  return { jobTitle, location };
}

async function getLocationId(locationName) {
  const url = `https://api.mantiks.io/location/search?name=${encodeURIComponent(locationName)}`;
  const response = await axios.get(url, {
    headers: {
      'x-api-key': API_KEY,
      'accept': 'application/json'
    }
  });
  const results = response.data?.results || [];
  if (!results.length) throw new Error('No location ID found for ' + locationName);
  return results[0].id;
}

async function fetchJobs(jobTitle, location) {
  try {
    const locationId = await getLocationId(location);
    const url = `https://api.mantiks.io/company/search?job_title=${encodeURIComponent(jobTitle)}&job_location_ids=${locationId}&job_age_in_days=${JOB_AGE_IN_DAYS}`;
    console.log('Querying Mantiks API:', url);
    const response = await axios.get(url, {
      headers: {
        'x-api-key': API_KEY,
        'accept': 'application/json'
      }
    });
    const companies = response.data?.companies || [];
    let allJobs = [];
    companies.forEach(company => {
      if (company.jobs && company.jobs.length) {
        company.jobs.forEach(job => {
          allJobs.push({
            title: job.job_title,
            company: company.name,
            location: job.location,
            job_board: job.job_board,
            url: job.job_board_url
          });
        });
      }
    });
    if (!allJobs.length) {
      console.log('No jobs found.');
      return;
    }
    allJobs.slice(0, 20).forEach((job, i) => {
      console.log(`\n#${i + 1}`);
      console.log('Title:', job.title);
      console.log('Company:', job.company);
      console.log('Location:', job.location);
      console.log('Job Board:', job.job_board);
      console.log('URL:', job.url);
    });
    console.log(`\nTotal jobs found: ${allJobs.length}`);
  } catch (error) {
    if (error.response) {
      console.error('Mantiks API error:', error.response.status, error.response.data);
    } else {
      console.error('Request error:', error.message);
    }
  }
}

const { jobTitle, location } = parseArgs();
fetchJobs(jobTitle, location); 