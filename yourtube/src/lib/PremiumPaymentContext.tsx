import React, { createContext, useContext, useState, ReactNode } from "react";
import axiosInstance from "@/lib/axiosinstance";
import { Button } from "@/components/ui/button";

interface PremiumPaymentContextType {
  show: boolean;
  open: (user: any) => void;
  close: () => void;
  user: any;
}

const PremiumPaymentContext = createContext<PremiumPaymentContextType | undefined>(undefined);

export const usePremiumPayment = () => {
  const ctx = useContext(PremiumPaymentContext);
  if (!ctx) throw new Error("usePremiumPayment must be used within PremiumPaymentProvider");
  return ctx;
};

export const PremiumPaymentProvider = ({ children }: { children: ReactNode }) => {
  const [show, setShow] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState("");

  const open = (u: any) => {
    setUser(u);
    setShow(true);
    setError("");
  };
  const close = () => setShow(false);

  const handlePremiumPayment = async () => {
    if (!(window as any).Razorpay) {
      setError("Razorpay SDK not loaded");
      return;
    }
    try {
      const orderRes = await axiosInstance.post("/plan/upgrade", { plan: "gold", userid: user._id });
      const options = {
        key: "rzp_test_RAq8aVJexGG31U",
        amount: orderRes.data.amount,
        currency: orderRes.data.currency,
        name: "YourTube Premium",
        description: "Upgrade to premium for unlimited downloads",
        order_id: orderRes.data.orderId,
        handler: async function (response: any) {
          try {
            await axiosInstance.post("/plan/verify", {
              plan: "gold",
              paymentId: response.razorpay_payment_id,
              orderId: response.razorpay_order_id,
              signature: response.razorpay_signature,
              userid: user._id,
            });
            setShow(false);
          } catch (e) {
            setError("Premium activation failed");
          }
        },
        prefill: {
          name: user?.name,
          email: user?.email,
        },
      };
      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (e) {
      setError("Failed to initiate premium payment");
    }
  };

  return (
    <PremiumPaymentContext.Provider value={{ show, open, close, user }}>
      {children}
      {show && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white p-6 rounded shadow-lg">
            <h2 className="text-lg font-bold mb-2">Upgrade to Premium</h2>
            <p className="mb-4">Unlock unlimited downloads and more features!</p>
            {error && <div className="text-red-500 mb-2">{error}</div>}
            <Button className="w-full bg-yellow-400 hover:bg-yellow-500 text-black mb-2" onClick={handlePremiumPayment}>
              Pay with Razorpay
            </Button>
            <Button variant="outline" className="w-full" onClick={close}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </PremiumPaymentContext.Provider>
  );
};
