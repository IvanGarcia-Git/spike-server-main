export const ContractLogs = {
  DraftCreated: "Se ha creado la plantilla",
  NoDraftCreated: "Se ha creado la ficha",

  ContractStateChanged: (
    userName: string,
    contractCups: string,
    oldStateName: string,
    newStateName: string
  ) => `${userName} ha pasado ${contractCups} de ${oldStateName} a ${newStateName}`,
};
