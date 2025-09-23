import React from "react";
import { Button } from "@/components/ui/button";
import { usePremiumPayment } from "@/lib/PremiumPaymentContext";

const plans = [
  { name: "Free", limit: 5, price: 0, desc: "Watch videos for 5 mins per session." },
  { name: "Bronze", limit: 7, price: 10, desc: "Watch videos for 7 mins per session." },
  { name: "Silver", limit: 10, price: 50, desc: "Watch videos for 10 mins per session." },
  { name: "Gold", limit: Infinity, price: 100, desc: "Unlimited video watch time!" },
];

export default function PlanUpgrade({ user }: { user: any }) {
  const { open } = usePremiumPayment();
  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Upgrade Your Plan</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {plans.map((plan) => {
          const isCurrent = user.plan?.toLowerCase() === plan.name.toLowerCase();
          return (
            <div
              key={plan.name}
              className={`border rounded p-4 flex flex-col items-center ${isCurrent ? "border-yellow-400 bg-yellow-50" : ""}`}
            >
              <h3 className="text-lg font-semibold mb-2">{plan.name}</h3>
              <div className="mb-2">{plan.desc}</div>
              <div className="mb-2 font-bold text-xl">
                {plan.price === 0 ? "Free" : `₹${plan.price}`}
              </div>
              {isCurrent ? (
                <span className="text-green-600 font-semibold">Current Plan</span>
              ) : (
                <Button onClick={() => open({ ...user, plan: plan.name.toLowerCase() })}>
                  Upgrade to {plan.name}
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
