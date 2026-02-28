const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
    console.log("Assets with org:", await prisma.asset.count({ where: { organizationId: '9d1fec0c-d8b8-4e3a-8d20-d9ec8c505325' } }));
    
    // Check Suramya
    const u = await prisma.user.findUnique({ where: { id: '7372b385-be6b-4767-b818-657b6b74ccb2' }, select: { id: true, email: true, organizationId: true, role: { select: {name:true, type:true}} } });
    console.log("Suramya:", u);

    // Call getAssets logic
    const { organizationId, id: userId, role } = u;
    const userRoleName = role?.name || u.LegacyRole;
    const userRoleType = role?.type || '';
    
    const isSuperViewer = ['HR', 'Director', 'Admin', 'Owner', 'AssetMgr', 'Co-Founder'].includes(userRoleName)
             || userRoleName === 'ADMIN'
             || userRoleType === 'ADMINISTRATOR';
             
    console.log("IsSuperViewer?", isSuperViewer);
    
    if (isSuperViewer) {
       const a = await prisma.asset.findMany({ where: { organizationId } });
       console.log("Assets returned:", a.length);
    }
}
run();
