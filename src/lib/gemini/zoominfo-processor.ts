import { ICP_CRITERIA } from './config';

export interface ZoomInfoContact {
  // Personal Info
  firstName: string;
  lastName: string;
  fullName: string;
  jobTitle: string;
  managementLevel: string;
  department: string;
  jobFunction: string;
  jobStartDate: string;
  
  // Contact Details
  email: string;
  directPhone: string;
  mobilePhone: string;
  linkedinProfile: string;
  
  // Company Info
  companyName: string;
  website: string;
  industry: string;
  subIndustry: string;
  employees: string;
  employeeRange: string;
  revenue: string;
  revenueRange: string;
  foundedYear: string;
  
  // Company Details
  ticker: string;
  sicCodes: string;
  naicsCodes: string;
  businessModel: string;
  ownershipType: string;
  
  // Funding Info
  totalFunding: string;
  recentFunding: string;
  recentFundingRound: string;
  recentFundingDate: string;
  recentInvestors: string;
  
  // Location
  companyAddress: string;
  companyCity: string;
  companyState: string;
  companyCountry: string;
  
  // URLs
  zoomInfoCompanyUrl: string;
  linkedinCompanyUrl: string;
  facebookUrl: string;
  twitterUrl: string;
}

export interface ICPValidation {
  qualified: boolean;
  reasons: string[];
}

export class ZoomInfoProcessor {
  processZoomInfoData(csvData: any[]): ZoomInfoContact[] {
    return csvData.map(row => ({
      // Personal Info
      firstName: row['First Name'] || '',
      lastName: row['Last Name'] || '',
      fullName: `${row['First Name'] || ''} ${row['Last Name'] || ''}`.trim(),
      jobTitle: row['Job Title'] || '',
      managementLevel: row['Management Level'] || '',
      department: row['Department'] || '',
      jobFunction: row['Job Function'] || '',
      jobStartDate: row['Job Start Date'] || '',
      
      // Contact Details
      email: row['Email Address'] || '',
      directPhone: row['Direct Phone Number'] || '',
      mobilePhone: row['Mobile phone'] || '',
      linkedinProfile: row['LinkedIn Contact Profile URL'] || '',
      
      // Company Info
      companyName: row['Company Name'] || '',
      website: row['Website'] || '',
      industry: row['Primary Industry'] || '',
      subIndustry: row['Primary Sub-Industry'] || '',
      employees: row['Employees'] || '',
      employeeRange: row['Employee Range'] || '',
      revenue: row['Revenue (in 000s USD)'] || '',
      revenueRange: row['Revenue Range (in USD)'] || '',
      foundedYear: row['Founded Year'] || '',
      
      // Company Details
      ticker: row['Ticker'] || '',
      sicCodes: row['SIC Codes'] || '',
      naicsCodes: row['NAICS Codes'] || '',
      businessModel: row['Business Model'] || '',
      ownershipType: row['Ownership Type'] || '',
      
      // Funding Info
      totalFunding: row['Total Funding Amount (in 000s USD)'] || '',
      recentFunding: row['Recent Funding Amount (in 000s USD)'] || '',
      recentFundingRound: row['Recent Funding Round'] || '',
      recentFundingDate: row['Recent Funding Date'] || '',
      recentInvestors: row['Recent Investors'] || '',
      
      // Location
      companyAddress: row['Company Street Address'] || '',
      companyCity: row['Company City'] || '',
      companyState: row['Company State'] || '',
      companyCountry: row['Company Country'] || '',
      
      // URLs
      zoomInfoCompanyUrl: row['ZoomInfo Company Profile URL'] || '',
      linkedinCompanyUrl: row['LinkedIn Company Profile URL'] || '',
      facebookUrl: row['Facebook Company Profile URL'] || '',
      twitterUrl: row['Twitter Company Profile URL'] || ''
    }));
  }

  validateICP(contact: ZoomInfoContact): ICPValidation {
    const validation: ICPValidation = {
      qualified: true,
      reasons: []
    };

    // Check company size
    const employeeCount = parseInt(contact.employees?.replace(/,/g, '') || '0');
    if (employeeCount < ICP_CRITERIA.employeeRange.min || employeeCount > ICP_CRITERIA.employeeRange.max) {
      validation.qualified = false;
      validation.reasons.push(`Employee count (${employeeCount}) outside range ${ICP_CRITERIA.employeeRange.min}-${ICP_CRITERIA.employeeRange.max}`);
    }

    // Check target industries
    const isTargetIndustry = ICP_CRITERIA.targetIndustries.some(industry => 
      contact.industry?.toLowerCase().includes(industry.toLowerCase())
    );
    if (!isTargetIndustry) {
      validation.qualified = false;
      validation.reasons.push(`Industry "${contact.industry}" not in target list`);
    }

    // Check persona level
    const isSeniorRole = ICP_CRITERIA.seniorTitles.some(title => 
      contact.jobTitle?.toLowerCase().includes(title.toLowerCase())
    );
    if (!isSeniorRole) {
      validation.qualified = false;
      validation.reasons.push(`Job title "${contact.jobTitle}" below Director level`);
    }

    // Check relevant departments
    const isRelevantDept = ICP_CRITERIA.targetDepartments.some(dept => 
      contact.department?.toLowerCase().includes(dept) || 
      contact.jobFunction?.toLowerCase().includes(dept) ||
      contact.jobTitle?.toLowerCase().includes(dept)
    );
    if (!isRelevantDept) {
      validation.qualified = false;
      validation.reasons.push(`Department/function not in target areas`);
    }

    return validation;
  }
}