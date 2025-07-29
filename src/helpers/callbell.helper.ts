import AWS from "aws-sdk";
const eventBridge = new AWS.EventBridge();

export namespace CallBellHelper {
  export const createContactAndSendMessage = async (
    phoneNumber: string,
    name: string
  ) => {
    const EVENT_BUS_NAME = "default";

    try {
      const result = await eventBridge
        .putEvents({
          Entries: [
            {
              Source: "lambda.private",
              DetailType: "callbell-request",
              Detail: JSON.stringify({
                phoneNumber,
                name,
                actionType: "createContact",
              }),
              EventBusName: EVENT_BUS_NAME,
            },
          ],
        })
        .promise();

      console.log("✅ Event sent to EventBridge:", result);
      return {
        statusCode: 200,
        body: JSON.stringify({ message: "Event sent to EventBridge" }),
      };
    } catch (error) {
      console.error("❌ Error sending to EventBridge:", error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: error.message }),
      };
    }
  };

  export const assignUserToContact = async (
    phoneNumber: string,
    userEmail: string
  ) => {
    try {
      const EVENT_BUS_NAME = "default";

      const result = await eventBridge
        .putEvents({
          Entries: [
            {
              Source: "lambda.private",
              DetailType: "callbell-request",
              Detail: JSON.stringify({
                phoneNumber,
                userEmail,
                actionType: "assignToUser",
              }),
              EventBusName: EVENT_BUS_NAME,
            },
          ],
        })
        .promise();

      console.log("✅ Event sent to EventBridge:", result);
      return {
        statusCode: 200,
        body: JSON.stringify({ message: "Event sent to EventBridge" }),
      };
    } catch (error) {
      console.error("❌ Error sending to EventBridge:", error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: error.message }),
      };
    }
  };
}
