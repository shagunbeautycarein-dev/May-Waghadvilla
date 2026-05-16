export interface Step1Personal {
  fullName: string;
  mobile: string;
  email: string;
  dob: string;
  bloodGroup: string;
  address: string;
  country: string;
  state: string;
  city: string;
  pinCode: string;
}

export interface EmergencyContact {
  name: string;
  relation: string;
  mobile: string;
  city: string;
}

export interface Step2Emergency {
  contacts: EmergencyContact[];
}

export interface Step3Job {
  companyName: string;
  occupation: string;
  officeAddress: string;
  officeContact: string;
}

export interface Step4Documents {
  aadhar?: string;
  pan?: string;
  photo?: string;
  idType?: string;
  idFrontUrl?: string;
  idBackUrl?: string;
  additionalDocs?: string[];
}

export interface Step8Payment {
  method: string;
  amountPaid: number;
  transactionId: string;
  proofUrl: string;
}

export interface OnboardingFormData {
  step1?: Step1Personal;
  step2?: Step2Emergency;
  step3?: Step3Job;
  step4?: Step4Documents;
  step5?: boolean;
  step6?: boolean;
  step7?: boolean;
  step8?: Step8Payment;
}
