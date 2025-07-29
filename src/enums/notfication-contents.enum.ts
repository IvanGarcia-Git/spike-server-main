export const NotificationContents = {
  TaskAssigned: (subject: string) =>
    `Se te ha asignado una nueva tarea - ${subject}`,
  VacationRequest: (userFullName: string) =>
    `El usuario ${userFullName} ha solicitado una ausencia`,
  TaskDone: (subject: string) =>
    `La tarea ${subject} ha pasado a estado HECHO`,
  ReminderPending: (subject: string) =>
    `Tienes un nuevo recordatorio - ${subject}`,
  LeadCallPending: (subject: string) =>
    `Tienes una llamada a lead - ${subject}`,
  ContractActivated: (contractCups: string) =>
    `El contrato ${contractCups} - esta activo`,
  ContractExpired: (contractCups: string) =>
    `La retro del contrato ${contractCups} - ha llegado a su fin`,
  ContractRenew: (contractCups: string) =>
    `El contrato ${contractCups} - ha pagado renovación(12 meses)`,
  ContractCommented: (contractCups: string) =>
    `Se ha añadido un comentario al siguiente contrato ${contractCups}`,
};
