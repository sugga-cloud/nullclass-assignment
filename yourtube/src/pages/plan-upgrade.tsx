import React from "react";
import PlanUpgrade from "@/components/plan/PlanUpgrade";
import { PremiumPaymentProvider } from "@/lib/PremiumPaymentContext";

import { useUser } from "@/lib/AuthContext";

export default function PlanUpgradePage() {
  const { user } = useUser();
  return (
    <PremiumPaymentProvider>
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
        {user && <PlanUpgrade user={user} />}
        {user && (
          <div className="mt-6 text-center text-gray-700">
            <div className="font-semibold">Current Plan: <span className="capitalize">{user.plan}</span></div>
            {user.planExpiry && (
              <div>Expires: {new Date(user.planExpiry).toLocaleDateString()}</div>
            )}
            {user.plan === "gold" && <div>Unlimited access</div>}
          </div>
        )}
      </div>
    </PremiumPaymentProvider>
  );
}
