import AdminTable from "@/components/AdminTable";

export const metadata = {
  title: "Admin Approvals - Strategy First Room Scheduling",
  description: "Operations Admin Proposal Review and Approvals",
};

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <AdminTable />
    </div>
  );
}
