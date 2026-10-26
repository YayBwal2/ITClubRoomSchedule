//apprive or reject from admin

import AdminTable from "@/components/AdminTable";

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">School Operations Admin</h1>
        <p className="text-slate-500 text-sm mt-1">
          Review room allocation requests, manage campus facility statuses, and oversee timetables.
        </p>
      </div>

      <AdminTable />
    </div>
  );
}
