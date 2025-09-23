import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { Toaster } from "@/components/ui/sonner";
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { UserProvider } from "../lib/AuthContext";
import { PremiumPaymentProvider } from "@/lib/PremiumPaymentContext";
import Head from "next/head";
export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
        <title>Your-Tube Clone</title>
      </Head>
      <UserProvider>
        <PremiumPaymentProvider>
          <div className="min-h-screen bg-white text-black">
            <Header />
            <Toaster />
            <div className="flex">
              <Sidebar />
              <Component {...pageProps} />
            </div>
          </div>
        </PremiumPaymentProvider>
      </UserProvider>
    </>
  );
}
