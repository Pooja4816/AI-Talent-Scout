const fs = require('fs');

const firstNames = [
  "Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Sai", "Ayaan", "Krishna", "Ishaan", "Shaurya",
  "Atharva", "Rohan", "Ananya", "Diya", "Aditi", "Isha", "Kavya", "Meera", "Neha", "Pooja",
  "Riya", "Sneha", "Tara", "Anjali", "Suresh", "Ramesh", "Deepak", "Vikram", "Rahul", "Priya",
  "Maya", "Kiran", "Nikhil", "Gaurav", "Siddharth", "Manish", "Kartik", "Karan", "Vishal", "Ajay",
  "Sanjay", "Anil", "Sunil", "Rajesh", "Ashok", "Amit", "Sumit", "Vikas", "Vijay", "Vinay",
  "Ravi", "Mohit", "Tarun", "Arun", "Manoj", "Harish", "Prakash", "Pradeep", "Sandeep", "Naveen",
  "Praveen", "Rakesh", "Ganesh", "Mahesh", "Suresh", "Dinesh", "Mukesh", "Raj", "Sameer", "Sachin",
  "Nitin", "Varun", "Yash", "Kabir", "Aryan", "Rishabh", "Om", "Dhruv", "Rudra", "Dev"
];

const lastNames = [
  "Sharma", "Verma", "Gupta", "Malhotra", "Singh", "Patel", "Kumar", "Das", "Bose", "Chakraborty",
  "Nair", "Menon", "Pillai", "Iyer", "Rao", "Reddy", "Chowdary", "Naidu", "Agarwal", "Bansal",
  "Garg", "Jain", "Shah", "Mehta", "Desai", "Joshi", "Bhatt", "Misra", "Pandey", "Shukla",
  "Tiwari", "Yadav", "Ahluwalia", "Kapoor", "Chopra", "Khanna", "Ayer", "Sen", "Nath", "Sinha"
];

const roles = [
  {
    role: "Frontend Engineer",
    skills: ["HTML", "CSS", "JavaScript", "React", "Vue", "Angular", "Tailwind CSS", "SASS", "TypeScript", "Next.js", "Figma", "Redux"]
  },
  {
    role: "Backend Engineer",
    skills: ["Node.js", "Express", "Python", "Django", "Java", "Spring Boot", "Go", "C#", ".NET", "PostgreSQL", "MongoDB", "Redis", "AWS"]
  },
  {
    role: "Full Stack Developer",
    skills: ["JavaScript", "TypeScript", "React", "Node.js", "Express", "MongoDB", "PostgreSQL", "Tailwind CSS", "Docker", "AWS", "GraphQL", "Next.js"]
  },
  {
    role: "Data Scientist",
    skills: ["Python", "R", "SQL", "Pandas", "NumPy", "TensorFlow", "PyTorch", "Scikit-Learn", "Tableau", "Machine Learning", "Data Visualization", "Spark"]
  },
  {
    role: "DevOps Engineer",
    skills: ["Linux", "Docker", "Kubernetes", "AWS", "Azure", "CI/CD", "Jenkins", "Terraform", "Ansible", "Bash", "Python", "Monitoring"]
  },
  {
    role: "UI/UX Designer",
    skills: ["Figma", "Adobe XD", "Sketch", "Prototyping", "Wireframing", "User Research", "Illustrator", "Photoshop", "CSS", "HTML", "Interaction Design"]
  },
  {
    role: "Mobile/App Developer",
    skills: ["Swift", "Kotlin", "React Native", "Flutter", "Objective-C", "Java", "Dart", "Firebase", "SQLite", "UI/UX", "App Store Optimization"]
  },
  {
    role: "Digital Marketing Specialist",
    skills: ["SEO", "SEM", "Google Analytics", "Content Marketing", "Social Media Management", "Email Marketing", "Copywriting", "HubSpot", "PPC", "Marketing Strategy"]
  },
  {
    role: "Financial Analyst",
    skills: ["Excel", "Financial Modeling", "Accounting", "SQL", "Tableau", "Python", "Risk Management", "Corporate Finance", "Valuation", "Bloomberg"]
  },
  {
    role: "Healthcare Professional",
    skills: ["Patient Care", "EMR/EHR", "Clinical Research", "Medical Terminology", "CPR", "Data Entry", "Healthcare Administration", "Public Health"]
  }
];

const expRanges = ["1 year", "2 years", "3 years", "4 years", "5 years", "6 years", "7 years", "8 years", "9 years", "10+ years"];

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

function getRandomElements(arr, num) {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, num);
}

const candidates = [];

for (let i = 1; i <= 150; i++) {
  const firstName = firstNames[getRandomInt(firstNames.length)];
  const lastName = lastNames[getRandomInt(lastNames.length)];
  const roleObj = roles[getRandomInt(roles.length)];
  
  // They have between 4 to 8 skills from their domain
  const numSkills = Math.min(roleObj.skills.length, Math.floor(Math.random() * 5) + 4); 
  const cSkills = getRandomElements(roleObj.skills, numSkills);
  
  const experience = expRanges[getRandomInt(expRanges.length)];
  
  candidates.push({
    id: i,
    name: `${firstName} ${lastName}`,
    role: roleObj.role,
    skills: cSkills,
    experience: experience
  });
}

fs.writeFileSync('data/candidates.json', JSON.stringify(candidates, null, 2));
console.log('Successfully generated 150 diverse candidates with Indian names and multiple sectors.');
