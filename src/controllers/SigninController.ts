import z from "zod";
import { HttpResponse } from "../types/Http";
import { badRequest, ok } from "../utils/Http";

const schema = z.object({
  email: z.email(),
  password: z.string().min(8),
});

export class SignInController {
  static async handle({ body }): Promise<HttpResponse> {
    const { success, error, data } = schema.safeParse(body);
    if (!success) {
      return badRequest({ errors: error.issues });
    }

    return ok({
      accessToken: "signup: token de acesso",
      data,
    });
  }
}
