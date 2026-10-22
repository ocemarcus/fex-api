import { TransferStatus } from "@modules/transfer/repositories/transfer.repository";
import { generateId } from "@shared/utils/utils";

export enum EventsNotificationType {
  TRANSFER_IN = "TRANSFER_IN",
  TRANSFER_ACK = "TRANSFER_ACK",
  KEY_BLOCK = "KEY_BLOCK",
}
export const newEventsNotification = (data: {
  pspId: string;
  targetUrl: string;
  eventType: EventsNotificationType;
  payload: {
    transferId: string;
    status: TransferStatus;
    amount?: number;
    reason?: string;
  };
}) => {
  const payload = Buffer.from(
    JSON.stringify({
      ...data.payload,
      eventType: data.eventType,
    }),
  ).toString("base64");

  return {
    payload,
    id: generateId(),
    pspId: data.pspId,
    targetUrl: data.targetUrl,
    eventType: data.eventType,
  };
};
