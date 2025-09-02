import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import z from "zod";
import { db } from "../db";
import { usersTable } from "../db/schema";

import { calculateGoals } from "../lib/goalCalculator";
import { signAccessTokenFor } from "../lib/jtw";
import { HttpRequest, HttpResponse } from "../types/Http";
import { badRequest, conflict, created } from "../utils/Http";

const schema = z.object({
  goal: z.enum(["lose", "maintain", "gain"]),
  gender: z.enum(["male", "female"]),
  birthDate: z.iso.date(),
  height: z.number(),
  weight: z.number(),
  activityLevel: z.number().min(1).max(5),
  account: z.object({
    name: z.string(),
    email: z.email(),
    password: z.string().min(8),
  }),
});

export class SignUpController {
  static async handle({ body }: HttpRequest): Promise<HttpResponse> {
    const { success, error, data } = schema.safeParse(body);
    if (!success) {
      return badRequest({ errors: error.issues });
    }

    const usersAlreadyExists = await db.query.usersTable.findFirst({
      columns: {
        email: true,
      },
      where: eq(usersTable.email, data.account.email),
    });

    if (usersAlreadyExists) {
      return conflict({ error: "This email is already in use" });
    }

    const { account, ...rest } = data;

    const goals = calculateGoals({
      activityLevel: rest.activityLevel,
      birthDate: new Date(rest.birthDate),
      gender: rest.gender,
      goal: rest.goal,
      height: rest.height,
      weight: rest.weight,
    });

    const hashedPassword = await hash(account.password, 8);

    const [user] = await db
      .insert(usersTable)
      .values({
        ...rest,
        ...account,
        ...goals,
        password: hashedPassword,
      })
      .returning({
        id: usersTable.id,
      });

    const accessToken = signAccessTokenFor(user.id);

    return created({
      accessToken,
    });
  }
}
