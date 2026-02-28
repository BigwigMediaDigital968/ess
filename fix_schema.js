const fs = require('fs');
let schema = fs.readFileSync('backend/prisma/schema.prisma', 'utf8');

// Fix Department relation
schema = schema.replace(
  /model Department \{[\s\S]*?createdAt.*?DateTime.*?@default\(now\(\)\)\n(.*?)\}/,
  (match, p1) => match.replace(p1, p1 + '  problemGroups    Problem[]            @relation("ProblemAssignmentGroup")\n')
);

// Fix User relation
schema = schema.replace(
  /model User \{[\s\S]*?createdAt.*?DateTime.*?@default\(now\(\)\)\n(.*?)\}/,
  (match, p1) => match.replace(p1, p1 + '  problemActivities ProblemActivity[]\n')
);

// Fix TicketCategoryModel relation
schema = schema.replace(
  /model TicketCategoryModel \{[\s\S]*?createdAt.*?DateTime.*?@default\(now\(\)\)\n(.*?)\}/,
  (match, p1) => match.replace(p1, p1 + '  problems         Problem[]\n')
);

fs.writeFileSync('backend/prisma/schema.prisma', schema);
