import React from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { MOCK_MODE } from "@/config/mockMode";

const MockModeBanner: React.FC = () => {
  if (!MOCK_MODE) return null;

  return 
};

export default MockModeBanner;
