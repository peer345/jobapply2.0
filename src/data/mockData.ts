// ===== USER PROFILE =====
export const mockProfile = {
  fullName: "Alex Morgan",
  email: "alex.morgan@email.com",
  phone: "+44 7700 900123",
  linkedin: "https://linkedin.com/in/alexmorgan",
  github: "https://github.com/alexmorgan",
  portfolio: "https://alexmorgan.dev",
  currentCity: "London",
  preferredCity: "Berlin",
  skills: ["React", "TypeScript", "Node.js", "Python", "SQL", "AWS", "Docker", "GraphQL", "Tailwind CSS", "Next.js"],
  education: [
    { degree: "MSc Computer Science", institution: "Imperial College London", year: "2023" },
    { degree: "BSc Software Engineering", institution: "University of Edinburgh", year: "2021" },
  ],
  experience: [
    { title: "Frontend Engineer", company: "TechCorp", duration: "2023 - Present", description: "Built React applications serving 50K+ users." },
    { title: "Software Intern", company: "StartupXYZ", duration: "2022 - 2023", description: "Developed REST APIs and microservices." },
  ],
  projects: [
    { name: "E-Commerce Platform", tech: "React, Node.js, PostgreSQL", description: "Full-stack marketplace with real-time features." },
    { name: "ML Pipeline Dashboard", tech: "Python, FastAPI, React", description: "Monitoring dashboard for ML model training." },
  ],
};

// ===== JOB SOURCES =====
export type SourceCategory = "direct" | "account_required" | "coming_soon";
export interface JobSource {
  id: string;
  name: string;
  description: string;
  category: SourceCategory;
  loginRequired: boolean;
  autoApply: boolean;
  supportsJobs: boolean;
  supportsInternships: boolean;
  connected: boolean;
  lastSynced?: string;
}

export const mockSources: JobSource[] = [
  { id: "lever", name: "Lever", description: "Modern recruiting platform used by fast-growing companies.", category: "direct", loginRequired: false, autoApply: true, supportsJobs: true, supportsInternships: true, connected: true, lastSynced: "2 hours ago" },
  { id: "greenhouse", name: "Greenhouse", description: "Enterprise hiring platform for structured recruitment.", category: "direct", loginRequired: false, autoApply: true, supportsJobs: true, supportsInternships: true, connected: true, lastSynced: "1 hour ago" },
  { id: "ashby", name: "Ashby", description: "All-in-one recruiting platform for scaling teams.", category: "direct", loginRequired: false, autoApply: true, supportsJobs: true, supportsInternships: false, connected: true },
  { id: "smartrecruiters", name: "SmartRecruiters", description: "Talent acquisition suite for enterprise hiring.", category: "direct", loginRequired: false, autoApply: true, supportsJobs: true, supportsInternships: true, connected: false },
  { id: "workable", name: "Workable", description: "Flexible hiring software for growing businesses.", category: "direct", loginRequired: false, autoApply: true, supportsJobs: true, supportsInternships: true, connected: false },
  { id: "linkedin", name: "LinkedIn", description: "World's largest professional network.", category: "account_required", loginRequired: true, autoApply: false, supportsJobs: true, supportsInternships: true, connected: true, lastSynced: "30 min ago" },
  { id: "internshala", name: "Internshala", description: "India's leading internship and training platform.", category: "account_required", loginRequired: true, autoApply: false, supportsJobs: false, supportsInternships: true, connected: false },
  { id: "naukri", name: "Naukri", description: "India's premier job search engine.", category: "account_required", loginRequired: true, autoApply: false, supportsJobs: true, supportsInternships: false, connected: false },
  { id: "foundit", name: "Foundit", description: "Global job search and career platform.", category: "account_required", loginRequired: true, autoApply: false, supportsJobs: true, supportsInternships: true, connected: false },
  { id: "jobvite", name: "Jobvite", description: "End-to-end talent acquisition suite.", category: "account_required", loginRequired: true, autoApply: false, supportsJobs: true, supportsInternships: false, connected: true, lastSynced: "1 day ago" },
  { id: "icims", name: "iCIMS", description: "Leading cloud recruiting platform.", category: "account_required", loginRequired: true, autoApply: false, supportsJobs: true, supportsInternships: true, connected: false },
  { id: "ats_systems", name: "Additional ATS Systems", description: "BambooHR, JazzHR, Breezy HR, and more.", category: "coming_soon", loginRequired: false, autoApply: false, supportsJobs: true, supportsInternships: true, connected: false },
  { id: "career_pages", name: "Company Career Pages", description: "Direct scraping of company career sites.", category: "coming_soon", loginRequired: false, autoApply: false, supportsJobs: true, supportsInternships: true, connected: false },
  { id: "more_integrations", name: "More Integrations", description: "Indeed, Glassdoor, AngelList, and more coming.", category: "coming_soon", loginRequired: false, autoApply: false, supportsJobs: true, supportsInternships: true, connected: false },
];

// ===== JOB MATCHES =====
export type OpportunityType = "full-time" | "internship";
export type ApplyStatus = "ready" | "needs_account" | "unsupported" | "applied" | "skipped";
export type FitLevel = "strong" | "good" | "moderate" | "weak";

export interface JobMatch {
  id: string;
  title: string;
  company: string;
  location: string;
  remote: "remote" | "hybrid" | "onsite";
  source: string;
  sourceCategory: SourceCategory;
  type: OpportunityType;
  postedDate: string;
  matchPercent: number;
  atsScore: number;
  missingSkills: string[];
  missingKeywords: string[];
  applyStatus: ApplyStatus;
  fitLevel: FitLevel;
  salary?: string;
  description: string;
  strongAreas: string[];
  weakAreas: string[];
  experienceGap?: string;
  locationMismatch?: boolean;
}

export const mockJobs: JobMatch[] = [
  {
    id: "1", title: "Senior Frontend Engineer", company: "Stripe", location: "London, UK", remote: "hybrid",
    source: "Lever", sourceCategory: "direct", type: "full-time", postedDate: "2 hours ago", matchPercent: 94,
    atsScore: 88, missingSkills: ["Rust"], missingKeywords: ["payment systems"], applyStatus: "ready",
    fitLevel: "strong", salary: "£85,000 - £110,000",
    description: "Join Stripe's frontend team to build the next generation of payment infrastructure UI.",
    strongAreas: ["React expertise", "TypeScript proficiency", "Modern CSS"], weakAreas: ["Payment domain knowledge"],
  },
  {
    id: "2", title: "Full Stack Developer", company: "Revolut", location: "Berlin, Germany", remote: "remote",
    source: "Greenhouse", sourceCategory: "direct", type: "full-time", postedDate: "5 hours ago", matchPercent: 87,
    atsScore: 82, missingSkills: ["Kotlin", "Kafka"], missingKeywords: ["fintech", "microservices architecture"], applyStatus: "ready",
    fitLevel: "good", salary: "€75,000 - €95,000",
    description: "Build scalable financial products used by millions across Europe.",
    strongAreas: ["Full-stack experience", "API design"], weakAreas: ["Fintech experience", "JVM languages"],
  },
  {
    id: "3", title: "Software Engineering Intern", company: "Canva", location: "Sydney, Australia", remote: "hybrid",
    source: "Lever", sourceCategory: "direct", type: "internship", postedDate: "1 day ago", matchPercent: 78,
    atsScore: 75, missingSkills: ["Java"], missingKeywords: ["design tools"], applyStatus: "ready",
    fitLevel: "good", salary: "AU$4,500/month stipend",
    description: "Summer internship building creative tools used by 130M+ monthly active users.",
    strongAreas: ["Frontend skills", "Project portfolio"], weakAreas: ["Design tool domain"], experienceGap: "Requires current enrollment",
  },
  {
    id: "4", title: "React Developer", company: "Shopify", location: "Toronto, Canada", remote: "remote",
    source: "LinkedIn", sourceCategory: "account_required", type: "full-time", postedDate: "3 hours ago", matchPercent: 91,
    atsScore: 85, missingSkills: ["Ruby"], missingKeywords: ["e-commerce"], applyStatus: "needs_account",
    fitLevel: "strong", salary: "CAD $110,000 - $140,000",
    description: "Help millions of merchants build their online stores with cutting-edge React.",
    strongAreas: ["React mastery", "Component architecture", "Performance"], weakAreas: ["E-commerce domain"],
  },
  {
    id: "5", title: "Frontend Intern", company: "Notion", location: "San Francisco, US", remote: "onsite",
    source: "Greenhouse", sourceCategory: "direct", type: "internship", postedDate: "12 hours ago", matchPercent: 82,
    atsScore: 79, missingSkills: [], missingKeywords: ["productivity tools"], applyStatus: "ready",
    fitLevel: "good", salary: "$8,000/month stipend",
    description: "Build the future of productivity and note-taking tools.",
    strongAreas: ["Strong React skills", "Clean code practices"], weakAreas: ["US relocation required"], locationMismatch: true,
  },
  {
    id: "6", title: "Platform Engineer", company: "Datadog", location: "Paris, France", remote: "hybrid",
    source: "Ashby", sourceCategory: "direct", type: "full-time", postedDate: "2 days ago", matchPercent: 71,
    atsScore: 68, missingSkills: ["Go", "Kubernetes"], missingKeywords: ["observability", "distributed systems"], applyStatus: "ready",
    fitLevel: "moderate", salary: "€65,000 - €85,000",
    description: "Build monitoring and analytics platform processing trillions of data points.",
    strongAreas: ["Cloud experience", "Docker"], weakAreas: ["Go expertise", "Distributed systems"], experienceGap: "3+ years preferred",
  },
  {
    id: "7", title: "Backend Developer", company: "Razorpay", location: "Bangalore, India", remote: "onsite",
    source: "Naukri", sourceCategory: "account_required", type: "full-time", postedDate: "6 hours ago", matchPercent: 65,
    atsScore: 60, missingSkills: ["Java", "Spring Boot"], missingKeywords: ["payment gateway", "high availability"], applyStatus: "needs_account",
    fitLevel: "moderate", salary: "₹18,00,000 - ₹25,00,000",
    description: "Build India's leading payment infrastructure serving millions of businesses.",
    strongAreas: ["API development", "SQL"], weakAreas: ["Java ecosystem", "Payment domain"],
  },
  {
    id: "8", title: "Data Science Intern", company: "DeepMind", location: "London, UK", remote: "onsite",
    source: "Lever", sourceCategory: "direct", type: "internship", postedDate: "1 day ago", matchPercent: 58,
    atsScore: 55, missingSkills: ["PyTorch", "TensorFlow", "R"], missingKeywords: ["research", "machine learning", "neural networks"], applyStatus: "ready",
    fitLevel: "weak", salary: "£3,500/month stipend",
    description: "Research internship at the cutting edge of artificial intelligence.",
    strongAreas: ["Python knowledge", "Analytics mindset"], weakAreas: ["ML frameworks", "Research experience", "Statistical methods"],
  },
  {
    id: "9", title: "UI Engineer", company: "Figma", location: "London, UK", remote: "hybrid",
    source: "Workable", sourceCategory: "direct", type: "full-time", postedDate: "8 hours ago", matchPercent: 89,
    atsScore: 84, missingSkills: ["WebGL"], missingKeywords: ["design systems"], applyStatus: "applied",
    fitLevel: "strong", salary: "£90,000 - £120,000",
    description: "Build the collaborative design tool that's changing how teams create together.",
    strongAreas: ["React expertise", "CSS mastery", "Component design"], weakAreas: ["WebGL/Canvas"],
  },
  {
    id: "10", title: "Software Development Intern", company: "Flipkart", location: "Bangalore, India", remote: "onsite",
    source: "Internshala", sourceCategory: "account_required", type: "internship", postedDate: "4 hours ago", matchPercent: 72,
    atsScore: 70, missingSkills: ["Java"], missingKeywords: ["e-commerce", "scale"], applyStatus: "needs_account",
    fitLevel: "good", salary: "₹40,000/month stipend",
    description: "Intern with India's largest e-commerce company.",
    strongAreas: ["Full-stack skills", "Project experience"], weakAreas: ["Java required"],
  },
];

// ===== DASHBOARD STATS =====
export const mockDashboardStats = {
  fetchedToday: 47,
  eligibleAutoApply: 23,
  autoAppliedToday: 12,
  avgMatchScore: 76,
  failedApplications: 2,
  savedOpportunities: 15,
  applicationsThisWeek: 34,
  jobsCount: 31,
  internshipsCount: 16,
  atsScore: 82,
  avgCompatibility: 74,
  automationRunning: true,
};

export const mockSetupChecklist = [
  { id: "resume", label: "Resume uploaded", done: true },
  { id: "profile", label: "Profile completed", done: true },
  { id: "answers", label: "Answer bank completed", done: false },
  { id: "sources", label: "Preferred sources selected", done: true },
  { id: "accounts", label: "Connected accounts added", done: false },
  { id: "automation", label: "Automation enabled", done: true },
];

export const mockRecentActivity = [
  { id: "1", action: "Applied", target: "Senior Frontend Engineer at Stripe", time: "2 min ago", type: "success" as const },
  { id: "2", action: "Matched", target: "Full Stack Developer at Revolut", time: "15 min ago", type: "info" as const },
  { id: "3", action: "Skipped", target: "Backend Developer at Razorpay (account required)", time: "20 min ago", type: "warning" as const },
  { id: "4", action: "Failed", target: "Platform Engineer at Datadog", time: "1 hour ago", type: "error" as const },
  { id: "5", action: "Applied", target: "UI Engineer at Figma", time: "2 hours ago", type: "success" as const },
  { id: "6", action: "Matched", target: "Frontend Intern at Notion", time: "3 hours ago", type: "info" as const },
];

export const mockApplicationsOverTime = [
  { date: "Mon", applied: 5, matched: 12 },
  { date: "Tue", applied: 8, matched: 15 },
  { date: "Wed", applied: 6, matched: 10 },
  { date: "Thu", applied: 12, matched: 18 },
  { date: "Fri", applied: 9, matched: 14 },
  { date: "Sat", applied: 3, matched: 8 },
  { date: "Sun", applied: 2, matched: 5 },
];

export const mockMatchDistribution = [
  { range: "90-100%", count: 5 },
  { range: "80-89%", count: 8 },
  { range: "70-79%", count: 12 },
  { range: "60-69%", count: 7 },
  { range: "50-59%", count: 3 },
  { range: "<50%", count: 2 },
];

export const mockSourceBreakdown = [
  { name: "Lever", count: 14 },
  { name: "Greenhouse", count: 11 },
  { name: "LinkedIn", count: 8 },
  { name: "Ashby", count: 6 },
  { name: "Workable", count: 5 },
  { name: "Other", count: 3 },
];

// ===== ATS ANALYSIS =====
export const mockAtsAnalysis = {
  overall: 82,
  formatting: 90,
  keywords: 72,
  readability: 85,
  sectionCompleteness: 88,
  roleRelevance: 76,
  issues: [
    { severity: "high" as const, message: "Low keyword match for target roles (72%)", category: "Keywords" },
    { severity: "high" as const, message: "Missing quantified achievements in 2 bullet points", category: "Content" },
    { severity: "medium" as const, message: "Summary section could be stronger and more targeted", category: "Content" },
    { severity: "medium" as const, message: "Consider adding more industry-specific terminology", category: "Keywords" },
    { severity: "low" as const, message: "Portfolio URL not prominently displayed", category: "Formatting" },
    { severity: "low" as const, message: "Projects section could highlight tech stack more clearly", category: "Content" },
  ],
  topMissingKeywords: ["CI/CD", "Agile", "System Design", "Testing", "Accessibility", "Performance Optimization"],
  improvements: [
    "Add quantified metrics to all experience bullet points",
    "Include CI/CD and testing keywords throughout",
    "Strengthen summary with target role alignment",
    "Add accessibility and performance optimization mentions",
    "Reorganize skills section by proficiency level",
  ],
};

// ===== RESUME VERSIONS =====
export const mockResumes = [
  { id: "1", name: "General Resume v3", active: true, uploadDate: "2024-01-15", atsScore: 82, pages: 1 },
  { id: "2", name: "Frontend Focused", active: false, uploadDate: "2024-01-10", atsScore: 78, pages: 1 },
  { id: "3", name: "Full Stack Version", active: false, uploadDate: "2024-01-05", atsScore: 75, pages: 2 },
];

// ===== AUTO APPLY QUEUE =====
export type QueueStatus = "queued" | "processing" | "applied" | "failed" | "skipped" | "needs_account";

export interface QueueItem {
  id: string;
  jobTitle: string;
  company: string;
  matchPercent: number;
  type: OpportunityType;
  source: string;
  status: QueueStatus;
  estimatedTime?: string;
  priority: number;
}

export const mockQueue: QueueItem[] = [
  { id: "q1", jobTitle: "Senior Frontend Engineer", company: "Stripe", matchPercent: 94, type: "full-time", source: "Lever", status: "processing", estimatedTime: "~30s", priority: 1 },
  { id: "q2", jobTitle: "Full Stack Developer", company: "Revolut", matchPercent: 87, type: "full-time", source: "Greenhouse", status: "queued", estimatedTime: "~1 min", priority: 2 },
  { id: "q3", jobTitle: "Software Engineering Intern", company: "Canva", matchPercent: 78, type: "internship", source: "Lever", status: "queued", estimatedTime: "~1.5 min", priority: 3 },
  { id: "q4", jobTitle: "Frontend Intern", company: "Notion", matchPercent: 82, type: "internship", source: "Greenhouse", status: "queued", estimatedTime: "~2 min", priority: 4 },
  { id: "q5", jobTitle: "React Developer", company: "Shopify", matchPercent: 91, type: "full-time", source: "LinkedIn", status: "needs_account", priority: 5 },
  { id: "q6", jobTitle: "UI Engineer", company: "Figma", matchPercent: 89, type: "full-time", source: "Workable", status: "applied", priority: 6 },
  { id: "q7", jobTitle: "Platform Engineer", company: "Datadog", matchPercent: 71, type: "full-time", source: "Ashby", status: "failed", priority: 7 },
];

// ===== APPLIED JOBS =====
export type ApplicationStatus = "applied" | "failed" | "under_review" | "interview" | "rejected";

export interface AppliedJob {
  id: string;
  company: string;
  role: string;
  source: string;
  type: OpportunityType;
  matchPercent: number;
  appliedDate: string;
  status: ApplicationStatus;
  outcome?: string;
  notes?: string;
}

export const mockAppliedJobs: AppliedJob[] = [
  { id: "a1", company: "Stripe", role: "Senior Frontend Engineer", source: "Lever", type: "full-time", matchPercent: 94, appliedDate: "2024-01-15", status: "under_review" },
  { id: "a2", company: "Figma", role: "UI Engineer", source: "Workable", type: "full-time", matchPercent: 89, appliedDate: "2024-01-15", status: "interview", outcome: "Phone screen scheduled" },
  { id: "a3", company: "Vercel", role: "Frontend Developer", source: "Greenhouse", type: "full-time", matchPercent: 85, appliedDate: "2024-01-14", status: "applied" },
  { id: "a4", company: "Canva", role: "Software Engineering Intern", source: "Lever", type: "internship", matchPercent: 78, appliedDate: "2024-01-14", status: "rejected", outcome: "Position filled" },
  { id: "a5", company: "Linear", role: "Product Engineer", source: "Ashby", type: "full-time", matchPercent: 83, appliedDate: "2024-01-13", status: "under_review" },
  { id: "a6", company: "Notion", role: "Frontend Intern", source: "Greenhouse", type: "internship", matchPercent: 82, appliedDate: "2024-01-12", status: "applied" },
  { id: "a7", company: "Datadog", role: "Platform Engineer", source: "Ashby", type: "full-time", matchPercent: 71, appliedDate: "2024-01-12", status: "failed", notes: "Application form error" },
];

// ===== ANSWER BANK =====
export const mockAnswerBank = {
  noticePeriod: "2 weeks",
  workAuthorization: "Authorized to work in the UK",
  needSponsorship: "No",
  willingToRelocate: "Yes",
  expectedSalary: "£85,000 - £110,000",
  expectedStipend: "£3,000 - £4,500/month",
  yearsOfExperience: "3",
  linkedinUrl: "https://linkedin.com/in/alexmorgan",
  githubUrl: "https://github.com/alexmorgan",
  portfolioUrl: "https://alexmorgan.dev",
  currentCity: "London",
  preferredCity: "Berlin",
  completion: 85,
};

// ===== PREFERENCES =====
export const mockPreferences = {
  preferredRoles: ["Frontend Engineer", "Full Stack Developer", "Software Engineer", "UI Engineer"],
  locations: ["London", "Berlin", "Remote"],
  salaryRange: { min: 70000, max: 120000, currency: "GBP" },
  stipendRange: { min: 2500, max: 5000, currency: "GBP" },
  minMatchThreshold: 60,
  dailyApplyLimit: 25,
  remoteMode: "remote" as const,
  blacklistCompanies: ["BadCorp", "SpamJobs Inc"],
  opportunityType: "both" as const,
  automationRules: {
    directApplyOnly: false,
    skipUnconnectedAccounts: true,
    skipUnsupported: true,
    skipDuplicates: true,
    skipLowMatch: true,
  },
};

// ===== CONNECTED ACCOUNTS =====
export interface ConnectedAccount {
  id: string;
  name: string;
  connected: boolean;
  lastSynced?: string;
  profileCompleteness?: number;
}

export const mockConnectedAccounts: ConnectedAccount[] = [
  { id: "linkedin", name: "LinkedIn", connected: true, lastSynced: "30 min ago", profileCompleteness: 92 },
  { id: "internshala", name: "Internshala", connected: false },
  { id: "naukri", name: "Naukri", connected: false },
  { id: "foundit", name: "Foundit", connected: false },
];

// ===== RESUME OPTIMIZER =====
export const mockOptimizerSuggestions = {
  summary: {
    original: "Experienced software engineer with a passion for building user-facing applications.",
    suggested: "Results-driven Frontend Engineer with 3+ years of experience building high-performance React applications. Proven track record of delivering scalable UI solutions serving 50K+ users, with expertise in TypeScript, modern CSS, and component architecture.",
    reason: "The improved summary is more specific, includes quantified achievements, and targets frontend roles directly.",
  },
  bulletRewrites: [
    {
      original: "Built React applications for the company.",
      suggested: "Architected and shipped 5 React applications serving 50,000+ monthly active users, reducing page load times by 40% through code splitting and lazy loading.",
      reason: "Adds quantified impact and specific technical approaches.",
    },
    {
      original: "Worked on APIs and backend services.",
      suggested: "Designed and implemented 12 RESTful API endpoints with comprehensive test coverage (95%), reducing average response time from 450ms to 120ms.",
      reason: "Quantifies the work and highlights performance improvements.",
    },
  ],
  keywordGaps: [
    { keyword: "CI/CD", importance: "high", suggestion: "Mention CI/CD pipeline experience in your experience section" },
    { keyword: "Agile", importance: "high", suggestion: "Add Agile/Scrum methodology to your workflow experience" },
    { keyword: "Testing", importance: "medium", suggestion: "Include Jest, Cypress, or testing framework experience" },
    { keyword: "Accessibility", importance: "medium", suggestion: "Mention WCAG compliance or a11y testing" },
    { keyword: "System Design", importance: "low", suggestion: "Add system design experience for senior roles" },
  ],
  skillsSuggestion: ["React", "TypeScript", "JavaScript", "Node.js", "Python", "SQL", "AWS", "Docker", "GraphQL", "Tailwind CSS", "Next.js", "CI/CD", "Jest", "Agile"],
};
