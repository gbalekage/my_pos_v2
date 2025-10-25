import { CompanyForm } from "@/components/forms/company-form";
import { ComputerIcon } from "lucide-react";
import React from "react";
import CompanyImage from "@/assets/comp.jpg";
import { ThemeButton } from "@/components/global/theme-btn";

const CreateCompany = () => {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-between items-center">
          <div className="flex justify-center gap-2 md:justify-start">
            <a href="/" className="flex items-center gap-2 font-medium">
              <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
                <ComputerIcon className="size-4" />
              </div>
              <p className="text-xl">MYPOS</p>
            </a>
          </div>
          <ThemeButton />
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <CompanyForm />
          </div>
        </div>
      </div>
      <div className="bg-muted relative hidden lg:block">
        <img
          src={CompanyImage}
          alt="Company Image"
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>
    </div>
  );
};

export default CreateCompany;
