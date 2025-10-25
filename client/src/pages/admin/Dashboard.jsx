import AdminLayout from "@/components/admin/AdminLayout";
import ProfileContent from "@/components/profile-page/components/profile-content";
import ProfileHeader from "@/components/profile-page/components/profile-header";

const Dashboard = () => {
  return (
    <AdminLayout>
      <div className="mx-auto max-w-4xl space-y-6 px-4 py-10">
        <ProfileHeader />
        <ProfileContent />
      </div>
    </AdminLayout>
  );
};

export default Dashboard;
