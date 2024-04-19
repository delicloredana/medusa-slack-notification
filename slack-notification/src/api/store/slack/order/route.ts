import { MedusaRequest, MedusaResponse } from "@medusajs/medusa";

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  console.log(JSON.parse(req.body.payload));
  return;
};
