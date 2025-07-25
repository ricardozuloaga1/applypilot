import React from 'react';
import { CompanyLogo } from './CompanyLogo';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';

interface JobWithLogosProps {
  jobs: Array<{
    id: string;
    title: string;
    company: string;
    location: string;
    capturedAt: string;
    matchScore?: number;
    source: string;
  }>;
}

export const JobWithLogos: React.FC<JobWithLogosProps> = ({ jobs }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Captured Jobs with Company Logos</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {jobs.map((job, index) => (
            <div key={job.id || index} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-4">
                <CompanyLogo 
                  companyName={job.company} 
                  size="md"
                  className="flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-gray-900 truncate">
                    {job.title}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>{job.company}</span>
                    <span>•</span>
                    <span>{job.location}</span>
                    <span>•</span>
                    <Badge variant="outline" className="text-xs">
                      {job.source}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {job.matchScore && (
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {job.matchScore}%
                    </div>
                    <div className="text-xs text-gray-500">Match</div>
                  </div>
                )}
                <div className="text-right">
                  <div className="text-xs text-gray-500">
                    {new Date(job.capturedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {jobs.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No jobs captured yet. Start by visiting job posting sites and using the capture feature.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Demo component showing different logo sources
export const LogoSourcesDemo: React.FC = () => {
  const demoCompanies = [
    { name: 'Google', type: 'Clearbit API' },
    { name: 'Microsoft', type: 'Clearbit API' },
    { name: 'Apple', type: 'Clearbit API' },
    { name: 'Netflix', type: 'Clearbit API' },
    { name: 'StartupXYZ Inc', type: 'Fallback Initials' },
    { name: 'Local Business Co', type: 'Fallback Initials' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Company Logo Sources Demo</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {demoCompanies.map((company, index) => (
            <div key={index} className="text-center p-4 border rounded-lg">
              <CompanyLogo 
                companyName={company.name}
                size="lg"
                className="mx-auto mb-2"
              />
              <div className="text-sm font-medium">{company.name}</div>
              <div className="text-xs text-gray-500">{company.type}</div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium mb-2">Logo Sources:</h4>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• <strong>Clearbit API:</strong> High-quality official logos for major companies</li>
            <li>• <strong>Favicon:</strong> Company website favicons and icons</li>
            <li>• <strong>Fallback:</strong> Generated initials with company-specific colors</li>
            <li>• <strong>Cached:</strong> Previously fetched logos stored locally</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}; 