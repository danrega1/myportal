// ============================================
// SHARED.JS - Common functions for Leadership Portal
// ============================================

const GIST_FILENAME = 'leadership-portal-data.json';

// ============ AUTHENTICATION ============

function getToken() {
  return localStorage.getItem('github_token');
}

function setToken(token) {
  localStorage.setItem('github_token', token);
}

function getGistId() {
  return localStorage.getItem('gist_id');
}

function setGistId(id) {
  localStorage.setItem('gist_id', id);
}

function isAuthenticated() {
  return !!getToken();
}

function clearAuth() {
  localStorage.removeItem('github_token');
  localStorage.removeItem('gist_id');
}

async function verifyToken(token) {
  const response = await fetch('https://api.github.com/user', {
    headers: { 'Authorization': `token ${token}`, 'Accept': 'application/vnd.github.v3+json' }
  });
  return response.ok;
}

// ============ GITHUB GIST API ============

async function createGist(data) {
  const token = getToken();
  const response = await fetch('https://api.github.com/gists', {
    method: 'POST',
    headers: { 
      'Authorization': `token ${token}`, 
      'Content-Type': 'application/json', 
      'Accept': 'application/vnd.github.v3+json' 
    },
    body: JSON.stringify({ 
      description: 'Leadership Portal Data', 
      public: false, 
      files: { [GIST_FILENAME]: { content: JSON.stringify(data, null, 2) } } 
    })
  });
  if (!response.ok) throw new Error('Failed to create Gist');
  const gist = await response.json();
  setGistId(gist.id);
  return gist.id;
}

async function updateGist(data) {
  const token = getToken();
  const gistId = getGistId();
  if (!gistId) throw new Error('No Gist ID found');
  
  const response = await fetch(`https://api.github.com/gists/${gistId}`, {
    method: 'PATCH',
    headers: { 
      'Authorization': `token ${token}`, 
      'Content-Type': 'application/json', 
      'Accept': 'application/vnd.github.v3+json' 
    },
    body: JSON.stringify({ 
      files: { [GIST_FILENAME]: { content: JSON.stringify(data, null, 2) } } 
    })
  });
  if (!response.ok) throw new Error('Failed to update Gist');
  return await response.json();
}

async function fetchGist() {
  const token = getToken();
  const gistId = getGistId();
  if (!gistId) return null;
  
  const response = await fetch(`https://api.github.com/gists/${gistId}`, {
    headers: { 'Authorization': `token ${token}`, 'Accept': 'application/vnd.github.v3+json' }
  });
  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error('Failed to fetch Gist');
  }
  const gist = await response.json();
  const file = gist.files[GIST_FILENAME];
  if (file) return JSON.parse(file.content);
  return null;
}

async function findExistingGist() {
  const token = getToken();
  const response = await fetch('https://api.github.com/gists', {
    headers: { 'Authorization': `token ${token}`, 'Accept': 'application/vnd.github.v3+json' }
  });
  if (!response.ok) return null;
  const gists = await response.json();
  const existingGist = gists.find(g => g.files && g.files[GIST_FILENAME]);
  if (existingGist) {
    setGistId(existingGist.id);
    return existingGist.id;
  }
  return null;
}

async function saveToCloud(data) {
  const gistId = getGistId();
  if (!gistId) {
    return await createGist(data);
  } else {
    await updateGist(data);
    return gistId;
  }
}

async function loadFromCloud() {
  let gistId = getGistId();
  if (!gistId) {
    gistId = await findExistingGist();
  }
  if (!gistId) return null;
  return await fetchGist();
}

// ============ DEFAULT DATA STRUCTURES ============

function getDefaultDelegationData() {
  return {
    delegationLog: [],
    delegationTeamMembers: [
      { id: 1, name: 'Team Member 1', stretchProject: '', delegationLevel: 2, notes: '' },
      { id: 2, name: 'Team Member 2', stretchProject: '', delegationLevel: 2, notes: '' },
    ],
    quarterlyChecklist: {
      Q1: { items: [
        { id: 1, text: 'Create Delegation Inventory', done: false },
        { id: 2, text: 'Identify stretch project for each team member', done: false },
        { id: 3, text: 'Implement 5-minute rule', done: false },
        { id: 4, text: 'Start delegation conversations in 1:1s', done: false },
      ]},
      Q2: { items: [
        { id: 1, text: 'Assign ownership (not tasks) to 2+ team members', done: false },
        { id: 2, text: 'Practice coaching questions instead of answers', done: false },
        { id: 3, text: 'Establish review checkpoints for delegated projects', done: false },
        { id: 4, text: 'Have team members document their decisions', done: false },
      ]},
      Q3: { items: [
        { id: 1, text: 'Delegate a visible initiative to a team member', done: false },
        { id: 2, text: 'Have each team member lead a knowledge-sharing session', done: false },
        { id: 3, text: 'Step back from daily decisions in delegated areas', done: false },
        { id: 4, text: 'Ask team members what they can do now vs 6 months ago', done: false },
      ]},
      Q4: { items: [
        { id: 1, text: 'Share delegation progress with John', done: false },
        { id: 2, text: 'Gather team feedback on ownership and challenge', done: false },
        { id: 3, text: 'Plan next-level delegation for next year', done: false },
        { id: 4, text: 'Publicly recognize team member stretch accomplishments', done: false },
      ]},
    },
    impulseCounter: { caught: 0, redirected: 0 },
    savedReflections: []
  };
}

function getDefaultPerformanceData() {
  return {
    reviewYear: 2025,
    teams: {
      NCS: ['Terry', 'Anil', 'Suneesh'],
      CSTIMS: ['Murali', 'Ram', 'Samson']
    },
    weights: {
      aamvaCares: 0.25,
      competencies: 0.25,
      goals: 0.50
    },
    criteria: {
      aamvaCares: [
        { id: 'coach', name: 'Coach', description: 'Helping colleagues, employees, and leaders using a variety of positive and supportive methods and techniques. Support each other to achieve performance goals, personal satisfaction, and effectiveness through active listening and constructive feedback.' },
        { id: 'appreciate', name: 'Appreciate', description: 'Expressing the worth and importance of colleagues, employees, and leaders by recognizing the value of their ideas and efforts. Foster an environment where individuals receive proper recognition for their contributions.' },
        { id: 'respect', name: 'Respect', description: 'Treating, thinking about, and interacting with colleagues, employees, and leaders in a manner that is mindful of individual personalities. Foster a work environment where each individual feels safe and able to contribute.' },
        { id: 'empower', name: 'Empower', description: 'Committing to making co-workers, employees, and leaders stronger through open communication and delegation. Effectively collaborate and foster professional growth.' },
        { id: 'support', name: 'Support', description: 'Building strong relationships while displaying a harmonious and collaborative style. Develop and sustain relationships that enhance team spirit and cooperation within the organization.' }
      ],
      competencies: [
        { id: 'jobKnowledge', name: 'Application of Job Knowledge', description: 'Has an understanding of the facts, principles and expectations of their job. Demonstrates an understanding of knowledge specific to a technical, professional, or administrative field of work through application of related procedures, principles, theories or concepts.' },
        { id: 'managingTech', name: 'Managing Technology', description: 'Has an awareness of, researches and adopts effective technologies that improve the bottom line, works well with tech resources.' },
        { id: 'problemSolving', name: 'Problem Solving/Analysis', description: 'Able to understand a situation by moving through the data presented and processing the information in a systematic way in order to make effective and rational decisions. Identifies the cause and effect of issues and analyzes them from different angles, using several tools and techniques to construct different solutions to each issue.' },
        { id: 'technicalSkills', name: 'Technical Skills', description: 'Achieves a proficient level of technical and professional skills/knowledge in job-related areas; acquires and refines current developments in areas of expertise. Shows a savvy for technical issues and serves, uses his or her skills to enhance his or her work.' },
        { id: 'leadership', name: 'Leadership', description: 'Someone who is proactively working effectively to accomplish objectives in his or her own position and by building consensus on common goals.' }
      ]
    },
    teamMembers: {
      Terry: {
        name: 'Terry',
        team: 'NCS',
        aamvaCares: {
          coach: { self: 3, manager: 5, selfComment: 'I am committed to empowering colleagues through coaching and guidance.', managerComment: 'Terry demonstrates strong coaching qualities through his eagerness to help teammates understand application components.' },
          appreciate: { self: 4, manager: 4, selfComment: 'I make it a priority to recognize the contributions and efforts of colleagues.', managerComment: 'Terry consistently recognizes teammates\' contributions during meetings and elevates their success appropriately.' },
          respect: { self: 3, manager: 5, selfComment: 'I strive to treat colleagues with respect by being mindful of individual personalities.', managerComment: 'Terry maintains a patient and professional demeanor that ensures colleagues feel heard and valued.' },
          empower: { self: 3, manager: 3, selfComment: 'I am committed to empowering colleagues through open communication and delegation.', managerComment: 'Terry demonstrates solid empowerment practices through knowledge sharing and collaborative problem-solving.' },
          support: { self: 4, manager: 5, selfComment: 'I focus on building strong, collaborative relationships.', managerComment: 'Terry demonstrates strong support for the NCS project through consistent willingness to handle last-minute support tickets.' }
        },
        competencies: {
          jobKnowledge: { self: 4, manager: 4, selfComment: 'I consistently apply my in-depth knowledge of NCS software and Azure environments.', managerComment: 'Terry demonstrates strong subject matter knowledge of the NCS system.' },
          managingTech: { self: 3, manager: 3, selfComment: 'I effectively manage and leverage technology to support organizational goals.', managerComment: 'Terry has a good grasp of the technologies involved in NCS and SSO projects.' },
          problemSolving: { self: 3, manager: 4, selfComment: 'I consistently apply strong analytical and problem-solving skills.', managerComment: 'Terry consistently applies strong analytical and problem-solving skills to resolve technical issues.' },
          technicalSkills: { self: 3, manager: 3, selfComment: 'I demonstrate strong technical skills across a range of tools and platforms.', managerComment: 'Terry has strong technical skills across critical components to support the NCS system.' },
          leadership: { self: 3, manager: 3, selfComment: 'I demonstrate leadership by guiding teams and fostering collaboration.', managerComment: 'I appreciate Terry\'s professionalism, open communication and problem-solving mindset.' }
        },
        goals: [
          { id: 'g1', name: 'Authentication operation', self: 4, manager: 4, selfComment: 'Played a key role in maintaining and supporting the Authentication service.', managerComment: 'Terry did a great job supporting the Authentication Service.' },
          { id: 'g2', name: 'Authentication REST service framework upgrade', self: 3, manager: 4, selfComment: 'Collaborated to upgrade the Authentication REST service to .NET 8.', managerComment: 'Terry exceeded expectations on the Authentication REST service framework upgrade.' },
          { id: 'g3', name: 'NCS development', self: 3, manager: 3, selfComment: 'Involved in NCS Report development and load testing.', managerComment: 'Terry has demonstrated solid contributions to the NCS initiative.' },
          { id: 'g4', name: 'NCS Operation', self: 4, manager: 5, selfComment: 'Consistently supported subscriber test configuration and production go-live.', managerComment: 'Terry has been instrumental in supporting a multitude of NCS support tickets.' },
          { id: 'g5', name: 'NCS Reports', self: 3, manager: 4, selfComment: 'Successfully developed new reports and enhanced existing ones.', managerComment: 'Terry has delivered strong results in the reporting domain.' },
          { id: 'g6', name: 'SSO operation', self: 4, manager: 5, selfComment: 'Collaborated to maintain high availability of the SSO service.', managerComment: 'Terry exceeded expectations on SSO Operations.' }
        ],
        summary: 'Terry has delivered strong performance this year, particularly excelling in operational support for NCS and SSO services where he consistently made himself available for off-hour deployments. His technical expertise in NCS systems enabled key accomplishments. To continue growing, Terry should focus on improving cross-team communication protocols and expanding his technical depth in .NET components and exploring AI capabilities.',
        scores2024: { aamvaCares: 4.2, competencies: 3.5, goals: 3.8, overall: 3.825 }
      },
      Anil: {
        name: 'Anil',
        team: 'NCS',
        aamvaCares: {
          coach: { self: 4, manager: 4, selfComment: 'Consistently support colleagues on various issues by offering technical solutions.', managerComment: 'Anil consistently supports colleagues on various issues by offering technical solutions.' },
          appreciate: { self: 5, manager: 4, selfComment: 'I consistently respect and recognize the ideas and efforts of colleagues.', managerComment: 'Anil demonstrates strong appreciation practices by consistently recognizing contributions.' },
          respect: { self: 5, manager: 5, selfComment: 'I treat colleagues with respect and mindfulness.', managerComment: 'Anil demonstrates exceptional respect by treating colleagues and leaders thoughtfully.' },
          empower: { self: 4, manager: 3, selfComment: 'I actively support co-workers through open communication.', managerComment: 'Anil actively supports team members by promoting open communication.' },
          support: { self: 4, manager: 4, selfComment: 'Strong, positive connections are created through collaborative interactions.', managerComment: 'Anil builds strong, positive connections through respectful and collaborative interactions.' }
        },
        competencies: {
          jobKnowledge: { self: 5, manager: 4, selfComment: 'Possess strong knowledge of the application domain and infrastructure.', managerComment: 'Anil demonstrates strong knowledge of the NCS and SSO projects.' },
          managingTech: { self: 4, manager: 4, selfComment: 'Regularly adopts newer technologies to enhance system performance.', managerComment: 'Anil demonstrates strong awareness and adoption of newer technologies.' },
          problemSolving: { self: 5, manager: 4, selfComment: 'Uses logical analysis to solve technical problems.', managerComment: 'Anil demonstrated strong analytical capabilities.' },
          technicalSkills: { self: 5, manager: 4, selfComment: 'Has strong technical skills in software development and cloud platforms.', managerComment: 'Anil demonstrates strong technical proficiency.' },
          leadership: { self: 4, manager: 3, selfComment: 'Actively collaborates with team members and shares knowledge.', managerComment: 'Anil demonstrates solid leadership. There are opportunities to take greater initiatives.' }
        },
        goals: [
          { id: 'g1', name: 'Management Service Development', self: 4, manager: 4, selfComment: 'Successfully developed and tested the "Last Received and Sent" feature.', managerComment: 'Anil performed well on Management Service Development.' },
          { id: 'g2', name: 'NCS Logging service improvements support', self: 5, manager: 4, selfComment: 'Contributed to enhancements in the NCS Logging system.', managerComment: 'Anil did the development and execution of automated integration tests.' },
          { id: 'g3', name: 'NCS Operation', self: 5, manager: 5, selfComment: 'Supported NCS operations by monitoring system performance.', managerComment: 'Anil delivered outstanding performance on NCS Operations.' },
          { id: 'g4', name: 'SSO Operation Support', self: 5, manager: 5, selfComment: 'Provided SSO support by assisting with client-related tasks.', managerComment: 'Anil delivered outstanding performance on SSO Operation Support.' }
        ],
        summary: 'Anil delivered outstanding performance in NCS and SSO operations this year, demonstrating exceptional commitment to system reliability through proactive monitoring, effective debugging, and responsive on-call support. He has become the go-to person for integrating NCS reports into the UI. Anil is promoted to a senior developer role this year and is encouraged to continue his growth and focus on taking greater ownership and initiative.',
        scores2024: { aamvaCares: 3.8, competencies: 4.2, goals: 4.4, overall: 4.2 }
      },
      Suneesh: {
        name: 'Suneesh',
        team: 'NCS',
        aamvaCares: {
          coach: { self: 4, manager: 4, selfComment: 'I consistently collaborate with team members when they face technical challenges.', managerComment: 'Suneesh consistently collaborates with team members facing technical challenges.' },
          appreciate: { self: 4, manager: 4, selfComment: 'I actively listen to team members\' ideas.', managerComment: 'Suneesh actively listens to team members\' ideas and ensures conversations are constructive.' },
          respect: { self: 4, manager: 4, selfComment: 'I consistently treat my team members with respect.', managerComment: 'Suneesh consistently treats team members with respect and maintains professional interactions.' },
          empower: { self: 4, manager: 4, selfComment: 'I ensure team members have full ownership of their tasks.', managerComment: 'Suneesh ensures team members have full ownership of their tasks.' },
          support: { self: 4, manager: 4, selfComment: 'I support my team and other teams in the best possible way.', managerComment: 'Suneesh supports our team and other teams effectively.' }
        },
        competencies: {
          jobKnowledge: { self: 5, manager: 5, selfComment: 'I demonstrate a strong understanding of AAMVA systems and their integrations.', managerComment: 'Suneesh demonstrates exceptional understanding of NCS system and its components.' },
          managingTech: { self: 5, manager: 4, selfComment: 'I stay current with the latest technology trends.', managerComment: 'Suneesh stays current with the latest technology trends.' },
          problemSolving: { self: 5, manager: 4, selfComment: 'I demonstrate strong problem-solving skills.', managerComment: 'Suneesh demonstrates strong problem-solving skills.' },
          technicalSkills: { self: 5, manager: 5, selfComment: 'I have strong technical skills and have supported my team members.', managerComment: 'Suneesh demonstrates exceptional technical proficiency.' },
          leadership: { self: 5, manager: 4, selfComment: 'I consistently strive to set an example by adhering to best practices.', managerComment: 'Suneesh demonstrates leadership through his commitment to quality and standards.' }
        },
        goals: [
          { id: 'g1', name: 'Complete NCS operation improvements', self: 5, manager: 5, selfComment: 'I successfully completed the NCS operational improvement as planned.', managerComment: 'Suneesh successfully delivered various enhancements in the NCS application.' },
          { id: 'g2', name: 'Development of Edge status service', self: 4, manager: 4, selfComment: 'The timeline was adjusted to prioritize undeliverable features.', managerComment: 'Suneesh has been instrumental in the design, analysis and initial coding.' },
          { id: 'g3', name: 'Maintain NCS up time of 99.95%', self: 5, manager: 5, selfComment: 'NCS achieved 99.99% uptime in the last fiscal year.', managerComment: 'Suneesh has helped the NCS team deliver exceptional results in maintaining system availability.' }
        ],
        summary: 'Suneesh had outstanding results this year, demonstrating exceptional technical expertise and deep understanding of the NCS system architecture. He successfully delivered key enhancements including configurable event publishing, NCS processing statistics from V3 logs, and critical updates to the undeliverable manager. He has been a reliable partner in cross-team discussions. This year, I encourage him to be even more available and supportive to team members.',
        scores2024: { aamvaCares: 4.2, competencies: 4.2, goals: 4.7, overall: 4.45 }
      },
      Murali: {
        name: 'Murali',
        team: 'CSTIMS',
        aamvaCares: {
          coach: { self: 4, manager: 4, selfComment: 'I consistently make myself available to guide and support the team.', managerComment: 'Murali has helped the QA team implement a standalone approach for AVATTAR API test coverage.' },
          appreciate: { self: 4, manager: 4, selfComment: 'I make it a priority to recognize and appreciate team members\' efforts.', managerComment: 'Murali recognizes and appreciates team members\' ideas and efforts.' },
          respect: { self: 4, manager: 5, selfComment: 'I treat each team member with the same respect I would like to receive.', managerComment: 'Murali exemplifies exceptional interpersonal respect, fostering an inclusive environment.' },
          empower: { self: 4, manager: 4, selfComment: 'I consistently encourage open communication and welcome feedback.', managerComment: 'Murali welcomes feedback and suggestions with an open mind.' },
          support: { self: 4, manager: 4, selfComment: 'I consistently demonstrate a strong commitment to supporting the team.', managerComment: 'Murali demonstrates strong commitment to supporting the team.' }
        },
        competencies: {
          jobKnowledge: { self: 4, manager: 4, selfComment: 'I demonstrate a strong eagerness to learn new technologies.', managerComment: 'Murali has strong understanding of the CSTIMS application.' },
          managingTech: { self: 3, manager: 3, selfComment: 'I consistently pursue opportunities to learn new technologies.', managerComment: 'Murali has started learning React Native. There are opportunities to more proactively adopt technologies.' },
          problemSolving: { self: 4, manager: 4, selfComment: 'I approach problem-solving by carefully analyzing issues.', managerComment: 'Murali approaches problem-solving by carefully analyzing issues to identify root causes.' },
          technicalSkills: { self: 4, manager: 4, selfComment: 'I demonstrate strong technical proficiency.', managerComment: 'Murali demonstrates strong technical proficiency across development and testing areas.' },
          leadership: { self: 3, manager: 3, selfComment: 'I take a proactive and collaborative approach to leadership.', managerComment: 'Murali demonstrates solid leadership. There are opportunities to further develop leadership impact.' }
        },
        goals: [
          { id: 'g1', name: 'DLN Standardization', self: 4, manager: 4, selfComment: 'Successfully implemented DLN Standardization in CSTIMS NG.', managerComment: 'Murali performed well on DLN Standardization.' },
          { id: 'g2', name: 'Maintain 99.5% uptime of CSTIMS application', self: 4, manager: 4, selfComment: 'I consistently make myself available for on-call and releases support.', managerComment: 'Murali and team performed well in supporting CSTIMS application uptime.' },
          { id: 'g3', name: 'Support AVATTAR UI & API Testing', self: 4, manager: 4, selfComment: 'We continued to add more test cases for AVATTAR.', managerComment: 'Murali performed well in supporting AVATTAR testing efforts.' },
          { id: 'g4', name: 'Modular User Management', self: 4, manager: 4, selfComment: 'Successfully implemented the Modular User Management System.', managerComment: 'Murali performed well on implementing the enhancement.' },
          { id: 'g5', name: 'Applicant and Examiner Flags', self: 4, manager: 4, selfComment: 'Successfully completed Examiner and Applicant Flag functionalities.', managerComment: 'Murali performed well in completing the Flag functionalities.' }
        ],
        summary: 'Murali has been a dependable contributor to CSTIMS this year, successfully delivering key features including DLN Standardization, Modular User Management, and completing the Examiner and Applicant Flag functionalities. He demonstrates strong knowledge of the CSTIMS application. While Murali excels at executing assigned tasks, he needs to move beyond a "keeping the lights on" mindset and become more proactive in taking on new initiatives.',
        scores2024: { aamvaCares: 4.2, competencies: 4.2, goals: 4.1, overall: 4.15 }
      },
      Ram: {
        name: 'Ram',
        team: 'CSTIMS',
        aamvaCares: {
          coach: { self: 4, manager: 4, selfComment: 'I like to support my teammates by really listening to them.', managerComment: 'Ram supports teammates by actively listening and providing helpful feedback.' },
          appreciate: { self: 4, manager: 4, selfComment: 'I always try to notice and appreciate what my coworkers do.', managerComment: 'Ram consistently recognizes teammates\' contributions.' },
          respect: { self: 4, manager: 5, selfComment: 'I try to treat everyone with kindness and respect.', managerComment: 'Ram demonstrates strong respect towards his team members.' },
          empower: { self: 4, manager: 4, selfComment: 'I\'m all about building good working relationships.', managerComment: 'Ram has built strong working relationships with teammates.' },
          support: { self: 4, manager: 5, selfComment: 'I strive to foster strong relationships with my coworkers.', managerComment: 'Ram demonstrates exceptional relationship-building through effective collaboration.' }
        },
        competencies: {
          jobKnowledge: { self: 5, manager: 5, selfComment: 'I used my technical skills to deliver solid solutions.', managerComment: 'Ram demonstrates exceptional knowledge of the CSTIMS application.' },
          managingTech: { self: 4, manager: 4, selfComment: 'I took the lead on handling the tech side of CSTIMS projects.', managerComment: 'Ram shows excellent awareness of technologies that improve efficiency.' },
          problemSolving: { self: 4, manager: 4, selfComment: 'When I run into challenges, I like to look at all the info.', managerComment: 'Ram demonstrates strong analytical capabilities.' },
          technicalSkills: { self: 4, manager: 4, selfComment: 'I use my technical know-how to do my job well.', managerComment: 'Ram applies technical expertise effectively.' },
          leadership: { self: 3, manager: 3, selfComment: 'I like to take the lead in my role.', managerComment: 'Ram takes initiative in his role and works proactively.' }
        },
        goals: [
          { id: 'g1', name: 'ELDT Enhancements & Support', self: 4, manager: 4, selfComment: 'I worked on making ELDT better by adding new features.', managerComment: 'Ram performed well on ELDT enhancements and support.' },
          { id: 'g2', name: 'Software Updates', self: 3, manager: 4, selfComment: 'I worked on updating the software, including upgrading Angular.', managerComment: 'Ram exceeded expectations on software updates.' },
          { id: 'g3', name: 'State Support', self: 4, manager: 4, selfComment: 'I always made sure to deliver the data in the right format.', managerComment: 'Ram performed well in state support.' },
          { id: 'g4', name: 'Test Results Services Migration', self: 3, manager: 4, selfComment: 'I managed to move the Test Results service from v2 to v3.', managerComment: 'Ram exceeded expectations on the TRS 3.0 implementation.' },
          { id: 'g5', name: 'Worker Service Migration', self: 4, manager: 4, selfComment: 'I worked on moving the CSTIMS API to use service bus.', managerComment: 'Ram performed well on the Worker Service redesign effort.' }
        ],
        summary: 'Ram has been a strong performer this year, demonstrating exceptional knowledge of the CSTIMS application and consistently delivering quality results across multiple initiatives including the Angular upgrade, TRS 3.0 migration, and Worker Service redesign. He excels at troubleshooting complex production issues. Ram fosters excellent relationships with teammates. Moving forward, Ram is encouraged to continue seeking opportunities to volunteer for new initiatives.',
        scores2024: { aamvaCares: 4.4, competencies: 4.2, goals: 4.3, overall: 4.3 }
      },
      Samson: {
        name: 'Samson',
        team: 'CSTIMS',
        aamvaCares: {
          coach: { self: 4, manager: 4, selfComment: 'Consistently documented technical information for knowledge sharing.', managerComment: 'Samson demonstrates eagerness to better the team through documentation and knowledge sharing.' },
          appreciate: { self: 5, manager: 5, selfComment: 'I recognized the valuable contributions of my colleagues.', managerComment: 'Samson consistently expresses the worth and importance of team members.' },
          respect: { self: 5, manager: 5, selfComment: 'I consistently showed professional courtesy.', managerComment: 'Samson consistently treats and interacts with team members respectfully.' },
          empower: { self: 4, manager: 4, selfComment: 'I collaborated effectively with my team.', managerComment: 'Samson demonstrates commitment to making colleagues stronger.' },
          support: { self: 5, manager: 5, selfComment: 'Consistently supported the goal of enhancing team spirit.', managerComment: 'Samson demonstrates exceptional ability to develop relationships that enhance team collaboration.' }
        },
        competencies: {
          jobKnowledge: { self: 4, manager: 3, selfComment: 'Combined domain knowledge with new technologies.', managerComment: 'Samson demonstrates understanding of his job. There are opportunities to deepen his understanding of intricate parts of CSTIMS.' },
          managingTech: { self: 4, manager: 4, selfComment: 'Selectively adopted cloud technology offerings.', managerComment: 'Samson demonstrates strong awareness of effective technology offerings.' },
          problemSolving: { self: 4, manager: 4, selfComment: 'I focus on understanding the root causes of problems.', managerComment: 'Samson demonstrates strong ability to process information systematically.' },
          technicalSkills: { self: 4, manager: 5, selfComment: 'Demonstrated ability to implement strategies that address emerging challenges.', managerComment: 'Samson achieves an exceptional level of technical skills, including utilizing AI tools.' },
          leadership: { self: 4, manager: 4, selfComment: 'I consistently strive to make well-informed decisions.', managerComment: 'Samson\'s proactive approach to working effectively exceeds expectations for leadership.' }
        },
        goals: [
          { id: 'g1', name: 'Functional and Architectural understanding of CSTIMS', self: 4, manager: 4, selfComment: 'I kept myself familiar with sub-systems and components.', managerComment: 'Samson showed resourcefulness in addressing challenges by leveraging Claude AI.' },
          { id: 'g2', name: 'New/Enhanced Features: Support for CSTIMS', self: 5, manager: 5, selfComment: 'Supported multiple project priorities through design and implementation.', managerComment: 'Samson delivered an outstanding performance on the Worker Service redesign effort.' },
          { id: 'g3', name: 'Application Availability: Overall support for SPEXS', self: 4, manager: 5, selfComment: 'Provided strong support for SPEXS customer and jurisdiction environments.', managerComment: 'Samson exceeded expectations in supporting SPEXS operations.' }
        ],
        summary: 'Samson delivered outstanding performance this year, demonstrating exceptional technical skills and innovative thinking, particularly in the Worker Service redesign where he architected a cloud-native solution. He effectively leverages AI tools like Claude to enhance productivity. His collaborative style creates an outstanding environment where team members feel supported. Samson is encouraged to deepen his understanding of the legacy pieces of CSTIMS.',
        scores2024: { aamvaCares: 4.6, competencies: 4.0, goals: 4.5, overall: 4.4 }
      }
    }
  };
}

function getDefaultData() {
  return {
    delegation: getDefaultDelegationData(),
    performanceReview: getDefaultPerformanceData(),
    lastUpdated: new Date().toISOString()
  };
}

// ============ UTILITY FUNCTIONS ============

function getCurrentQuarter() {
  const month = new Date().getMonth();
  if (month < 3) return 'Q1';
  if (month < 6) return 'Q2';
  if (month < 9) return 'Q3';
  return 'Q4';
}

function getDayOfWeek() {
  return new Date().getDay(); // 0 = Sunday, 5 = Friday
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString();
}

function calculateCategoryAvg(member, category, performanceData) {
  const data = performanceData.teamMembers[member]?.[category];
  if (!data) return { self: 0, manager: 0 };
  const values = Object.values(data);
  const selfAvg = values.reduce((sum, v) => sum + (v.self || 0), 0) / values.length;
  const mgrAvg = values.reduce((sum, v) => sum + (v.manager || 0), 0) / values.length;
  return { self: selfAvg.toFixed(1), manager: mgrAvg.toFixed(1) };
}

function calculateGoalsAvg(member, performanceData) {
  const goals = performanceData.teamMembers[member]?.goals;
  if (!goals || goals.length === 0) return { self: 0, manager: 0 };
  const selfAvg = goals.reduce((sum, g) => sum + (g.self || 0), 0) / goals.length;
  const mgrAvg = goals.reduce((sum, g) => sum + (g.manager || 0), 0) / goals.length;
  return { self: selfAvg.toFixed(1), manager: mgrAvg.toFixed(1) };
}

function calculateOverallScore(member, performanceData) {
  const cares = calculateCategoryAvg(member, 'aamvaCares', performanceData);
  const comp = calculateCategoryAvg(member, 'competencies', performanceData);
  const goals = calculateGoalsAvg(member, performanceData);
  const w = performanceData.weights;
  const overall = (parseFloat(cares.manager) * w.aamvaCares) + (parseFloat(comp.manager) * w.competencies) + (parseFloat(goals.manager) * w.goals);
  return overall.toFixed(2);
}

function getRatingColor(rating) {
  if (rating >= 4.5) return 'text-green-600 bg-green-50';
  if (rating >= 3.5) return 'text-blue-600 bg-blue-50';
  if (rating >= 2.5) return 'text-yellow-600 bg-yellow-50';
  return 'text-red-600 bg-red-50';
}

function getRatingLabel(rating) {
  if (rating >= 4.5) return 'Outstanding';
  if (rating >= 3.5) return 'Exceeds';
  if (rating >= 2.5) return 'Meets';
  if (rating >= 1.5) return 'Needs Improvement';
  return 'Unsatisfactory';
}

// ============ ALERTS GENERATION ============

function generateAlerts(data) {
  const alerts = [];
  const today = new Date();
  const dayOfWeek = today.getDay();
  
  // Delegation alerts
  if (data.delegation) {
    // Friday reflection reminder
    if (dayOfWeek === 5) { // Friday
      const lastReflection = data.delegation.savedReflections?.[0];
      const lastReflectionDate = lastReflection ? new Date(lastReflection.date) : null;
      const isThisWeek = lastReflectionDate && 
        (today - lastReflectionDate) < 7 * 24 * 60 * 60 * 1000;
      if (!isThisWeek) {
        alerts.push({
          type: 'warning',
          icon: 'Calendar',
          title: 'Weekly Reflection Due',
          message: 'It\'s Friday! Time for your weekly delegation reflection.',
          link: 'delegation.html#weekly',
          priority: 1
        });
      }
    }
    
    // Quarterly goals progress
    const quarter = getCurrentQuarter();
    const checklist = data.delegation.quarterlyChecklist?.[quarter];
    if (checklist) {
      const done = checklist.items.filter(i => i.done).length;
      const total = checklist.items.length;
      if (done < total / 2) {
        alerts.push({
          type: 'info',
          icon: 'Target',
          title: `${quarter} Goals Behind`,
          message: `Only ${done}/${total} quarterly goals completed. Review your progress.`,
          link: 'delegation.html#quarterly',
          priority: 2
        });
      }
    }
    
    // Low impulse redirect rate
    const impulse = data.delegation.impulseCounter;
    if (impulse && impulse.caught > 5) {
      const rate = impulse.caught > 0 ? (impulse.redirected / impulse.caught) * 100 : 0;
      if (rate < 50) {
        alerts.push({
          type: 'warning',
          icon: 'AlertTriangle',
          title: 'Impulse Redirect Rate Low',
          message: `Your redirect rate is ${rate.toFixed(0)}%. Aim for 70%+.`,
          link: 'delegation.html',
          priority: 2
        });
      }
    }
    
    // Team members without stretch projects
    const membersWithoutStretch = data.delegation.delegationTeamMembers?.filter(m => !m.stretchProject) || [];
    if (membersWithoutStretch.length > 0) {
      alerts.push({
        type: 'info',
        icon: 'Users',
        title: 'Stretch Projects Needed',
        message: `${membersWithoutStretch.length} team member(s) don't have stretch projects assigned.`,
        link: 'delegation.html#team',
        priority: 3
      });
    }
  }
  
  // Performance review alerts
  if (data.performanceReview) {
    const members = Object.values(data.performanceReview.teamMembers || {});
    
    // Members without summary
    const noSummary = members.filter(m => !m.summary || m.summary.trim() === '');
    if (noSummary.length > 0) {
      alerts.push({
        type: 'warning',
        icon: 'FileText',
        title: 'Missing Review Summaries',
        message: `${noSummary.length} team member(s) need review summaries written.`,
        link: 'performance.html',
        priority: 1
      });
    }
    
    // Large self vs manager rating gaps
    members.forEach(member => {
      const cares = calculateCategoryAvg(member.name, 'aamvaCares', data.performanceReview);
      const gap = Math.abs(parseFloat(cares.self) - parseFloat(cares.manager));
      if (gap >= 1.5) {
        alerts.push({
          type: 'info',
          icon: 'MessageSquare',
          title: `Rating Gap: ${member.name}`,
          message: `Large gap between self (${cares.self}) and manager (${cares.manager}) ratings. Discuss in 1:1.`,
          link: `performance.html?member=${member.name}`,
          priority: 3
        });
      }
    });
  }
  
  // Sort by priority
  alerts.sort((a, b) => a.priority - b.priority);
  
  return alerts;
}
