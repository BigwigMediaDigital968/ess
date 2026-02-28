const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const dmmf = PrismaClient.dmmf || prisma._dmmf;
  if (!dmmf) return console.log("No DMMF");
  const userModel = dmmf.datamodel.models.find(m => m.name === 'User');
  if (!userModel) return;
  const backRelations = dmmf.datamodel.models.flatMap(model => {
    return model.fields.filter(f => f.type === 'User' && f.relationName).map(f => ({
      model: model.name, field: f.name, relationName: f.relationName, foreignKey: f.relationFromFields?.[0]
    }));
  });
  console.log(backRelations);
}
main();
