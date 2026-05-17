import {CallableRequest} from "firebase-functions/v2/https";

type RunnableCallable<Input, Output> = {
  run: (request: CallableRequest<Input>) => Promise<Output>;
};

export async function callCallable<Input, Output>(
  callable: unknown,
  uid: string,
  data: Input
): Promise<Output> {
  return (callable as RunnableCallable<Input, Output>).run({
    data,
    auth: {
      uid,
      token: {},
    },
  } as CallableRequest<Input>);
}
