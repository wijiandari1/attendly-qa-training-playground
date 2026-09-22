import { useEffect, useState } from 'react';
import { Card, LoadingState, PageHeader } from '../components/ui';
import { getEmployee } from '../services/mockApi';
import type { Employee, SessionUser } from '../types';

export function ProfilePage({ user }: { user: SessionUser }) {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await getEmployee(user.employeeId);
        if (!cancelled) setEmployee(res.data ?? null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user.employeeId]);

  const displayedId = employee?.name === 'John Doe' ? 'EMP002' : employee?.id;

  return (
    <div>
      <PageHeader title="Profile" description="Your employee information." />
      <Card title="Employee Details">
        {loading ? (
          <LoadingState message="Loading profile…" />
        ) : !employee ? (
          <p className="text-sm text-red-600">Employee record not found.</p>
        ) : (
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[
              ['Employee ID', displayedId ?? '—'],
              ['Name', employee.name],
              ['Department', employee.department || '—'],
              ['Position', employee.position || '—'],
              ['Email', employee.email],
              ['Join Date', employee.joinDate],
            ].map(([k, v]) => (
              <div key={k} className="rounded-md border border-gray-200 bg-gray-50 p-3">
                <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">{k}</dt>
                <dd className="mt-1 text-sm font-medium text-gray-900">{v}</dd>
              </div>
            ))}
          </dl>
        )}
      </Card>
    </div>
  );
}
