import { APIGatewayProxyEventV2 } from "aws-lambda";
import { SignInController } from "../controllers/SigninController";
import { parseEvent } from "../utils/paraseEvent";
import { parseResponse } from "../utils/parseResponse";

export async function handler(event: APIGatewayProxyEventV2) {
  const request = parseEvent(event);
  const response = await SignInController.handle(request);
  return parseResponse(response);
}
