import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Loader } from "lucide-react";

const SubscriptionCheck = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkCompanySubscriptionAndAdmin = async () => {
      try {
        // 1️⃣ Check company
        const companyRes = await axios.get("/api/company");
        const company = companyRes.data?.company;

        if (!company) {
          navigate("/create-company");
          return;
        }

        // 2️⃣ Check subscription
        try {
          const subscriptionRes = await axios.get(
            `/api/subscriptions/current/${company.id}`
          );
          const subscription = subscriptionRes.data?.subscription;

          if (!subscription) {
            navigate("/choose-subscription");
            return;
          }

          if (!subscription.isActive || subscription.status !== "ACTIVE") {
            navigate("/activate-subscription");
            return;
          }
        } catch (subError) {
          console.error("⚠️ Subscription check failed:", subError);
          const subStatus = subError.response?.status;
          if (subStatus === 404 || subStatus === 400) {
            navigate("/choose-subscription");
          } else {
            navigate("/error");
          }
          return;
        }

        try {
          const adminRes = await axios.get("/api/admin");
          const admin = adminRes.data?.admin;

          if (!admin) {
            setTimeout(() => navigate("/create-admin"), 300);

            return;
          }

          // ✅ Admin exists — allow access to app
        } catch (adminError) {
          console.error("⚠️ Admin check failed:", adminError);
          const adminStatus = adminError.response?.status;

          if (adminStatus === 404) {
            setTimeout(() => navigate("/create-admin"), 300);
          } else {
            navigate("/error");
          }
          return;
        }
      } catch (compError) {
        console.error("❌ Company check failed:", compError);
        const compStatus = compError.response?.status;

        if (compStatus === 404) {
          navigate("/create-company");
        } else {
          navigate("/error");
        }
        return;
      } finally {
        setLoading(false);
      }
    };

    checkCompanySubscriptionAndAdmin();
  }, [navigate]);

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader className="animate-spin size-6" />
      </div>
    );

  return children;
};

export default SubscriptionCheck;
