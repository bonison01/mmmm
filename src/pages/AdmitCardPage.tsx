import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import AdmitCardForm from "@/components/admitCard/AdmitCardForm";
import AdmitCardStatus from "@/components/admitCard/AdmitCardStatus";
import AdmitCardDisplay from "@/components/admitCard/AdmitCardDisplay";

interface AdmitCardData {
  form_no: string;
  applicant_name: string;
  father_name: string;
  photo_url: string;
  roll_number: string;
  class: string;
  exam_date: string;
  exam_time: string;
  exam_centre: string;
}

const AdmitCardPage = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [admitCardData, setAdmitCardData] = useState<AdmitCardData | null>(null);
  const [applicationStatus, setApplicationStatus] = useState<string | null>(null);

  const fetchAdmitCard = async (formNo: string) => {
    if (!formNo) {
      toast({
        title: "Required",
        description: "Please enter your form number",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    setApplicationStatus(null);

    try {
      console.log("Fetching application with form number:", formNo);

      const { data, error } = await supabase
        .from("mental_maths_applications")
        .select("form_no, applicant_name, father_name, photo_url, roll_number, class, exam_date, exam_time, exam_centre, payment_verified")
        .eq("form_no", formNo.trim());

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      console.log("Fetched data:", data);

      if (!data || data.length === 0) {
        toast({
          title: "Not Found",
          description: "No application found with this form number. Please check and try again.",
          variant: "destructive"
        });
        setAdmitCardData(null);
        return;
      }

      const application = data[0];

      // Application exists but check its status
      if (!application.payment_verified) {
        setApplicationStatus("Your payment is pending verification. Please check back later.");
        setAdmitCardData(null);
        return;
      }

      if (!application.roll_number) {
        setApplicationStatus("Your application has been received. Roll number not assigned yet. Please check back later.");
        setAdmitCardData(null);
        return;
      }

      // Check if ALL exam details are available
      if (!application.exam_date || !application.exam_time || !application.exam_centre) {
        const missingDetails = [];
        if (!application.exam_date) missingDetails.push("exam date");
        if (!application.exam_time) missingDetails.push("exam time");
        if (!application.exam_centre) missingDetails.push("exam centre");

        setApplicationStatus(`Your admit card is being prepared. ${missingDetails.join(", ")} information is not available yet. Please check back later.`);
        setAdmitCardData(null);
        return;
      }

      // All information is available, allow download
      setAdmitCardData(application as AdmitCardData);
      setApplicationStatus("Your admit card is ready for download.");
    } catch (error: any) {
      console.error("Error fetching admit card:", error);
      toast({
        title: "Error",
        description: "An error occurred while fetching your application details.",
        variant: "destructive"
      });
      setAdmitCardData(null);
    } finally {
      setLoading(false);
    }
  };

  const printAdmitCard = () => {
    window.print();
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <main className="flex-grow py-12 px-4 md:px-8 lg:px-16">
        <div className="container mx-auto max-w-4xl">
          <div className="mb-10 text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-4 text-gray-800">Mental Maths Competition Admit Card</h1>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">Enter your form number to download your admit card</p>
          </div>

          <AdmitCardForm onSubmit={fetchAdmitCard} loading={loading} />

          <AdmitCardStatus
            status={applicationStatus}
            isReady={applicationStatus?.includes("ready") || false}
          />

          <AdmitCardDisplay data={admitCardData} />

        </div>
      </main>

      <Footer />

      {/* Print Styling */}
      <style>
        {`
          @media print {
            body {
              background: white !important;
              margin: 0;
              padding: 0;
            }

            body * {
              visibility: hidden !important;
              box-shadow: none !important;
              background: none !important;
            }

            #admitCard, #admitCard * {
              visibility: visible !important;
              position: static !important;
              overflow: visible !important;
              color: black !important;
            }

            #admitCard {
              position: absolute !important;
              top: 0;
              left: 0;
              width: 100%;
              margin: 0;
              padding: 0;
              page-break-inside: avoid;
              font-size: 12pt;
            }

            nav, footer, header {
              display: none !important;
            }
          }
        `}
      </style>
    </div>
  );
};

export default AdmitCardPage;
