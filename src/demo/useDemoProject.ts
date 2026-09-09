import { useEffect, useState } from 'react';
import { demoService } from './service';

export function useDemoProject(jobId: string) {
  const [project, setProject] = useState(() => demoService().get(jobId));
  useEffect(() => {
    const refresh = () => setProject(demoService().get(jobId));
    refresh(); return demoService().subscribe(refresh);
  }, [jobId]);
  return project;
}
